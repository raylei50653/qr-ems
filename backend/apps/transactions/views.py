from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Transaction
from .serializers import TransactionSerializer
from apps.equipment.models import Equipment
from apps.users.models import User

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        action_param = self.request.query_params.get('action')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if action_param:
            queryset = queryset.filter(action=action_param)
            
        return queryset

    @action(detail=False, methods=['post'])
    def borrow(self, request):
        equipment_uuid = request.data.get('equipment_uuid')
        due_date = request.data.get('due_date')
        reason = request.data.get('reason', '')
        image = request.data.get('image')

        # Handle FormData string conversions
        if due_date in ['undefined', 'null', '']:
            due_date = None

        if not equipment_uuid:
            raise ValidationError("Equipment UUID is required")

        try:
            with transaction.atomic():
                equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)
                
                if equipment.status != Equipment.Status.AVAILABLE:
                    raise ValidationError("Equipment is not available")

                # Create Transaction with location snapshot
                txn = Transaction.objects.create(
                    equipment=equipment,
                    user=request.user,
                    action=Transaction.Action.BORROW,
                    status=Transaction.Status.PENDING_APPROVAL,
                    due_date=due_date,
                    reason=reason,
                    image=image,
                    location=equipment.location,
                    zone=equipment.zone,
                    cabinet=equipment.cabinet,
                    number=equipment.number
                )

                # Update Equipment
                equipment.status = Equipment.Status.PENDING_BORROW
                equipment.save()

                return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
             raise ValidationError("Equipment not found")

    def _process_approval(self, txn, admin_user, admin_note=''):
        """Internal helper to process a single transaction approval"""
        equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)
        
        if txn.status != Transaction.Status.PENDING_APPROVAL:
            return False, "Transaction is not pending approval"

        txn.status = Transaction.Status.COMPLETED
        txn.admin_verifier = admin_user
        txn.admin_note = admin_note
        
        if txn.action == Transaction.Action.BORROW:
            equipment.status = Equipment.Status.BORROWED
        elif txn.action == Transaction.Action.DISPATCH:
            equipment.status = Equipment.Status.DISPATCHED
            # We no longer clear location info here to keep traceability.
            # The status 'DISPATCHED' will indicate it's not physically present.
        elif txn.action == Transaction.Action.RETURN:
            equipment.status = Equipment.Status.AVAILABLE
            # If txn had location snapshot, we could use it, 
            # but usually approve_return handles location separately in its own view.
            # We'll let the specific approve_return handle its complex location logic.
            pass
        
        txn.save()
        equipment.save()
        return True, "Success"

    @action(detail=True, methods=['post'], url_path='approve-borrow')
    def approve_borrow(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        admin_note = request.data.get('admin_note', '')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            if txn.action != Transaction.Action.BORROW:
                raise ValidationError("Transaction is not a borrow request")
            
            success, message = self._process_approval(txn, request.user, admin_note)
            if not success:
                raise ValidationError(message)

            return Response(TransactionSerializer(txn).data)

    @action(detail=True, methods=['post'], url_path='reject-borrow')
    def reject_borrow(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_reason = request.data.get('rejection_reason', 'Rejected')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError("Transaction is not pending approval")

            if txn.action != Transaction.Action.BORROW:
                raise ValidationError("Transaction is not a borrow request")

            txn.status = Transaction.Status.REJECTED
            txn.admin_verifier = request.user
            txn.admin_note = rejection_reason # Use admin_note instead of overwriting reason
            txn.save()

            # Revert equipment status to AVAILABLE
            equipment.status = Equipment.Status.AVAILABLE
            equipment.save()

            return Response(TransactionSerializer(txn).data)

    @action(detail=False, methods=['post'], url_path='dispatch')
    def dispatch_item(self, request):
        """Request equipment to be dispatched (outbound)"""
        equipment_uuid = request.data.get('equipment_uuid')
        reason = request.data.get('reason', '')
        image = request.data.get('image')

        if not equipment_uuid:
            raise ValidationError("Equipment UUID is required")

        try:
            with transaction.atomic():
                equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)
                
                if equipment.status != Equipment.Status.AVAILABLE:
                    raise ValidationError("Equipment is not available for dispatch")

                # Create Transaction (Dispatch Request)
                txn = Transaction.objects.create(
                    equipment=equipment,
                    user=request.user,
                    action=Transaction.Action.DISPATCH,
                    status=Transaction.Status.PENDING_APPROVAL,
                    reason=reason,
                    image=image,
                    location=equipment.location,
                    zone=equipment.zone,
                    cabinet=equipment.cabinet,
                    number=equipment.number
                )

                # Use PENDING_BORROW for now or we could add PENDING_DISPATCH
                # Let's keep it simple and use PENDING_BORROW for any pending outbound
                equipment.status = Equipment.Status.PENDING_BORROW 
                equipment.save()

                return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
             raise ValidationError("Equipment not found")

    @action(detail=True, methods=['post'], url_path='approve-dispatch')
    def approve_dispatch(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        admin_note = request.data.get('admin_note', '')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            if txn.action != Transaction.Action.DISPATCH:
                raise ValidationError("Transaction is not a dispatch request")

            success, message = self._process_approval(txn, request.user, admin_note)
            if not success:
                raise ValidationError(message)

            return Response(TransactionSerializer(txn).data)

    @action(detail=True, methods=['post'], url_path='reject-dispatch')
    def reject_dispatch(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_reason = request.data.get('rejection_reason', 'Rejected')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError("Transaction is not pending approval")

            if txn.action != Transaction.Action.DISPATCH:
                raise ValidationError("Transaction is not a dispatch request")

            txn.status = Transaction.Status.REJECTED
            txn.admin_verifier = request.user
            txn.admin_note = rejection_reason
            txn.save()

            # Revert equipment status to AVAILABLE
            equipment.status = Equipment.Status.AVAILABLE
            equipment.save()

            return Response(TransactionSerializer(txn).data)

    @action(detail=False, methods=['post'], url_path='return-request')
    def return_request(self, request):
        equipment_uuid = request.data.get('equipment_uuid')
        
        if not equipment_uuid:
            raise ValidationError("Equipment UUID is required")

        try:
            with transaction.atomic():
                equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)
                
                if equipment.status != Equipment.Status.BORROWED:
                     raise ValidationError("Equipment is not currently borrowed")

                # Permission check: Only the original borrower OR an admin/manager can request return
                latest_borrow_transaction = equipment.transactions.filter(
                    action=Transaction.Action.BORROW,
                    status=Transaction.Status.COMPLETED
                ).order_by('-created_at').first()

                is_admin_or_manager = request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff
                
                if latest_borrow_transaction:
                    if latest_borrow_transaction.user != request.user and not is_admin_or_manager:
                        raise ValidationError("You can only return equipment that you have personally borrowed, unless you are an administrator.")
                else:
                    # No borrow record found, but status is BORROWED? 
                    # Allow admins to fix this via return request
                    if not is_admin_or_manager:
                        raise ValidationError("No active borrow record found for this equipment.")


                # Create Transaction (Return Request) with location snapshot
                txn = Transaction.objects.create(
                    equipment=equipment,
                    user=request.user, # The returner
                    action=Transaction.Action.RETURN,
                    status=Transaction.Status.PENDING_APPROVAL,
                    location=equipment.location,
                    zone=equipment.zone,
                    cabinet=equipment.cabinet,
                    number=equipment.number
                )

                # Update Equipment
                equipment.status = Equipment.Status.PENDING_RETURN
                equipment.save()

                return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
             raise ValidationError("Equipment not found")

    @action(detail=True, methods=['post'], url_path='approve-return')
    def approve_return(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Optional: admin can specify a new return location
        new_location_id = request.data.get('location')
        new_zone = request.data.get('zone')
        new_cabinet = request.data.get('cabinet')
        new_number = request.data.get('number')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError("Transaction is not pending approval")

            txn.status = Transaction.Status.COMPLETED
            txn.admin_verifier = request.user
            
            # If admin provided new location during approval, update equipment
            if new_location_id:
                from apps.locations.models import Location
                equipment.location = Location.objects.get(uuid=new_location_id)
            if new_zone is not None: equipment.zone = new_zone
            if new_cabinet is not None: equipment.cabinet = new_cabinet
            if new_number is not None: equipment.number = new_number

            # Update transaction snapshot to the FINAL location
            txn.location = equipment.location
            txn.zone = equipment.zone
            txn.cabinet = equipment.cabinet
            txn.number = equipment.number
            txn.save()

            equipment.status = Equipment.Status.AVAILABLE
            equipment.save()

            return Response(TransactionSerializer(txn).data)

    @action(detail=True, methods=['post'], url_path='reject-return')
    def reject_return(self, request, pk=None):
        # Only Manager+
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_reason = request.data.get('rejection_reason', 'Rejected')

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError("Transaction is not pending approval")

            txn.status = Transaction.Status.REJECTED
            txn.admin_verifier = request.user
            txn.admin_note = rejection_reason
            txn.save()

            # Revert equipment status to BORROWED
            equipment.status = Equipment.Status.BORROWED
            equipment.save()

            return Response(TransactionSerializer(txn).data)

    @action(detail=False, methods=['post'], url_path='bulk-approve')
    def bulk_approve(self, request):
        """Approve multiple transactions at once"""
        if not (request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff):
             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        transaction_ids = request.data.get('transaction_ids', [])
        admin_note = request.data.get('admin_note', 'Bulk approved')

        if not transaction_ids:
            raise ValidationError("No transaction IDs provided")

        results = {
            'success': [],
            'failed': []
        }

        with transaction.atomic():
            # Process one by one but in a single transaction block for overall data integrity
            # though we could decide to commit partially. Here we choose atomic.
            txns = Transaction.objects.select_for_update().filter(id__in=transaction_ids)
            
            for txn in txns:
                try:
                    success, message = self._process_approval(txn, request.user, admin_note)
                    if success:
                        results['success'].append(txn.id)
                    else:
                        results['failed'].append({'id': txn.id, 'error': message})
                except Exception as e:
                    results['failed'].append({'id': txn.id, 'error': str(e)})

        return Response(results)