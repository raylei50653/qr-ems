from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.equipment.models import Equipment
from apps.users.models import User

from .models import Transaction


class TransactionService:
    @staticmethod
    def create_borrow_request(
        user, equipment_uuid, due_date=None, reason='', image=None
    ):
        """
        Creates a borrow request for an equipment.
        """
        if due_date in ['undefined', 'null', '']:
            due_date = None

        with transaction.atomic():
            equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)

            if equipment.status != Equipment.Status.AVAILABLE:
                raise ValidationError('Equipment is not available')

            txn = Transaction.objects.create(
                equipment=equipment,
                user=user,
                action=Transaction.Action.BORROW,
                status=Transaction.Status.PENDING_APPROVAL,
                due_date=due_date,
                reason=reason,
                image=image,
                location=equipment.location,
                zone=equipment.zone,
                cabinet=equipment.cabinet,
                number=equipment.number,
            )

            equipment.status = Equipment.Status.PENDING_BORROW
            equipment.save()
            return txn

    @staticmethod
    def create_dispatch_request(user, equipment_uuid, reason='', image=None):
        """
        Creates a dispatch (outbound) request.
        """
        with transaction.atomic():
            equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)

            if equipment.status != Equipment.Status.AVAILABLE:
                raise ValidationError('Equipment is not available for dispatch')

            txn = Transaction.objects.create(
                equipment=equipment,
                user=user,
                action=Transaction.Action.DISPATCH,
                status=Transaction.Status.PENDING_APPROVAL,
                reason=reason,
                image=image,
                location=equipment.location,
                zone=equipment.zone,
                cabinet=equipment.cabinet,
                number=equipment.number,
            )

            # Mark as pending borrow/dispatch
            equipment.status = Equipment.Status.PENDING_BORROW
            equipment.save()
            return txn

    @staticmethod
    def create_return_request(user, equipment_uuid):
        """
        Creates a return request for borrowed equipment.
        Validates if the user is the original borrower or an admin.
        """
        with transaction.atomic():
            equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)

            if equipment.status != Equipment.Status.BORROWED:
                raise ValidationError('Equipment is not currently borrowed')

            # Permission check logic usually belongs to View or Permission class,
            # but business rule validation (is this the borrower?) can be here.
            # However, for Service layer, we often assume 'user' passed here is authorized to TRY.
            # We will strictly check logic consistency.

            latest_borrow = (
                equipment.transactions.filter(
                    action=Transaction.Action.BORROW,
                    status=Transaction.Status.COMPLETED,
                )
                .order_by('-created_at')
                .first()
            )

            is_privileged = (
                user.role in [User.Role.MANAGER, User.Role.ADMIN] or user.is_staff
            )

            if latest_borrow:
                if latest_borrow.user != user and not is_privileged:
                    raise ValidationError(
                        'You can only return equipment that you have personally borrowed.'
                    )
            else:
                if not is_privileged:
                    raise ValidationError(
                        'No active borrow record found for this equipment.'
                    )

            txn = Transaction.objects.create(
                equipment=equipment,
                user=user,  # The returner
                action=Transaction.Action.RETURN,
                status=Transaction.Status.PENDING_APPROVAL,
                location=equipment.location,
                zone=equipment.zone,
                cabinet=equipment.cabinet,
                number=equipment.number,
            )

            equipment.status = Equipment.Status.PENDING_RETURN
            equipment.save()
            return txn

    @staticmethod
    def approve_transaction(
        admin_user, transaction_id, admin_note='', new_location_data=None
    ):
        """
        Approves a transaction (Borrow, Dispatch, Return).
        Handles state transitions and location updates.
        """
        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=transaction_id)
            equipment = Equipment.objects.select_for_update().get(
                uuid=txn.equipment.uuid
            )

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError(f'Transaction {txn.id} is not pending approval')

            txn.status = Transaction.Status.COMPLETED
            txn.admin_verifier = admin_user
            txn.admin_note = admin_note

            if txn.action == Transaction.Action.BORROW:
                equipment.status = Equipment.Status.BORROWED

            elif txn.action == Transaction.Action.DISPATCH:
                equipment.status = Equipment.Status.DISPATCHED

            elif txn.action == Transaction.Action.RETURN:
                equipment.status = Equipment.Status.AVAILABLE

                # Handle Return Location Update
                if new_location_data:
                    from apps.locations.models import Location

                    loc_id = new_location_data.get('location')
                    if loc_id:
                        equipment.location = Location.objects.get(uuid=loc_id)

                    if 'zone' in new_location_data:
                        equipment.zone = new_location_data['zone']
                    if 'cabinet' in new_location_data:
                        equipment.cabinet = new_location_data['cabinet']
                    if 'number' in new_location_data:
                        equipment.number = new_location_data['number']

                # Snapshot the FINAL return location
                txn.location = equipment.location
                txn.zone = equipment.zone
                txn.cabinet = equipment.cabinet
                txn.number = equipment.number

            txn.save()
            equipment.save()
            return txn

    @staticmethod
    def reject_transaction(admin_user, transaction_id, rejection_reason='Rejected'):
        """
        Rejects a transaction and reverts equipment status.
        """
        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=transaction_id)
            equipment = Equipment.objects.select_for_update().get(
                uuid=txn.equipment.uuid
            )

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError(f'Transaction {txn.id} is not pending approval')

            txn.status = Transaction.Status.REJECTED
            txn.admin_verifier = admin_user
            txn.admin_note = rejection_reason
            txn.save()

            # Revert logic
            if txn.action in [Transaction.Action.BORROW, Transaction.Action.DISPATCH]:
                # Revert to AVAILABLE
                equipment.status = Equipment.Status.AVAILABLE
            elif txn.action == Transaction.Action.RETURN:
                # Revert to BORROWED
                equipment.status = Equipment.Status.BORROWED

            equipment.save()
            return txn
