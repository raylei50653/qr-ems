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
        if status_param:
            queryset = queryset.filter(status=status_param)
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
                    status=Transaction.Status.COMPLETED,
                    due_date=due_date,
                    reason=reason,
                    image=image,
                    location=equipment.location,
                    zone=equipment.zone,
                    cabinet=equipment.cabinet,
                    number=equipment.number
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
            txn.reason = rejection_reason # Append reason
            txn.save()

            # Revert equipment status to BORROWED
            equipment.status = Equipment.Status.BORROWED
            equipment.save()

            return Response(TransactionSerializer(txn).data)