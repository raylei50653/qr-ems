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

    @action(detail=False, methods=['post'])
    def borrow(self, request):
        equipment_uuid = request.data.get('equipment_uuid')
        due_date = request.data.get('due_date')
        reason = request.data.get('reason', '')

        if not equipment_uuid:
            raise ValidationError("Equipment UUID is required")

        try:
            with transaction.atomic():
                equipment = Equipment.objects.select_for_update().get(uuid=equipment_uuid)
                
                if equipment.status != Equipment.Status.AVAILABLE:
                    raise ValidationError("Equipment is not available")

                # Create Transaction
                txn = Transaction.objects.create(
                    equipment=equipment,
                    user=request.user,
                    action=Transaction.Action.BORROW,
                    status=Transaction.Status.COMPLETED,
                    due_date=due_date,
                    reason=reason
                )

                # Update Equipment
                equipment.status = Equipment.Status.BORROWED
                equipment.save()

                return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
             raise ValidationError("Equipment not found")

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

                # Permission check: Only the original borrower can request return
                latest_borrow_transaction = equipment.transactions.filter(
                    action=Transaction.Action.BORROW,
                    status=Transaction.Status.COMPLETED
                ).order_by('-created_at').first()

                if not latest_borrow_transaction or latest_borrow_transaction.user != request.user:
                    raise ValidationError("You can only return equipment that you have personally borrowed.")


                # Create Transaction (Return Request)
                txn = Transaction.objects.create(
                    equipment=equipment,
                    user=request.user, # The returner (should be the borrower)
                    action=Transaction.Action.RETURN,
                    status=Transaction.Status.PENDING_APPROVAL,
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

        with transaction.atomic():
            txn = Transaction.objects.select_for_update().get(pk=pk)
            equipment = Equipment.objects.select_for_update().get(uuid=txn.equipment.uuid)

            if txn.status != Transaction.Status.PENDING_APPROVAL:
                raise ValidationError("Transaction is not pending approval")

            txn.status = Transaction.Status.COMPLETED
            txn.admin_verifier = request.user
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
            txn.reason = rejection_reason # Append reason
            txn.save()

            # Revert equipment status to BORROWED
            equipment.status = Equipment.Status.BORROWED
            equipment.save()

            return Response(TransactionSerializer(txn).data)