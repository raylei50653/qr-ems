from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.equipment.models import Equipment
from apps.users.permissions import IsManagerOrAdmin

from .models import Transaction
from .serializers import TransactionSerializer
from .services import TransactionService


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

        if not equipment_uuid:
            raise ValidationError('Equipment UUID is required')

        try:
            txn = TransactionService.create_borrow_request(
                user=request.user,
                equipment_uuid=equipment_uuid,
                due_date=request.data.get('due_date'),
                reason=request.data.get('reason', ''),
                image=request.data.get('image'),
            )
            return Response(
                TransactionSerializer(txn).data, status=status.HTTP_201_CREATED
            )
        except Equipment.DoesNotExist:
            raise ValidationError('Equipment not found') from None

    @action(
        detail=True,
        methods=['post'],
        url_path='approve-borrow',
        permission_classes=[IsManagerOrAdmin],
    )
    def approve_borrow(self, request, pk=None):
        txn = self.get_object()
        if txn.action != Transaction.Action.BORROW:
            raise ValidationError('Transaction is not a borrow request')

        updated_txn = TransactionService.approve_transaction(
            admin_user=request.user,
            transaction_id=pk,
            admin_note=request.data.get('admin_note', ''),
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='reject-borrow',
        permission_classes=[IsManagerOrAdmin],
    )
    def reject_borrow(self, request, pk=None):
        txn = self.get_object()
        if txn.action != Transaction.Action.BORROW:
            raise ValidationError('Transaction is not a borrow request')

        updated_txn = TransactionService.reject_transaction(
            admin_user=request.user,
            transaction_id=pk,
            rejection_reason=request.data.get('rejection_reason', 'Rejected'),
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(detail=False, methods=['post'], url_path='dispatch')
    def dispatch_item(self, request):
        equipment_uuid = request.data.get('equipment_uuid')

        if not equipment_uuid:
            raise ValidationError('Equipment UUID is required')

        try:
            txn = TransactionService.create_dispatch_request(
                user=request.user,
                equipment_uuid=equipment_uuid,
                reason=request.data.get('reason', ''),
                image=request.data.get('image'),
            )
            return Response(
                TransactionSerializer(txn).data, status=status.HTTP_201_CREATED
            )
        except Equipment.DoesNotExist:
            raise ValidationError('Equipment not found') from None

    @action(
        detail=True,
        methods=['post'],
        url_path='approve-dispatch',
        permission_classes=[IsManagerOrAdmin],
    )
    def approve_dispatch(self, request, pk=None):
        txn = self.get_object()
        if txn.action != Transaction.Action.DISPATCH:
            raise ValidationError('Transaction is not a dispatch request')

        updated_txn = TransactionService.approve_transaction(
            admin_user=request.user,
            transaction_id=pk,
            admin_note=request.data.get('admin_note', ''),
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='reject-dispatch',
        permission_classes=[IsManagerOrAdmin],
    )
    def reject_dispatch(self, request, pk=None):
        txn = self.get_object()
        if txn.action != Transaction.Action.DISPATCH:
            raise ValidationError('Transaction is not a dispatch request')

        updated_txn = TransactionService.reject_transaction(
            admin_user=request.user,
            transaction_id=pk,
            rejection_reason=request.data.get('rejection_reason', 'Rejected'),
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(detail=False, methods=['post'], url_path='return-request')
    def return_request(self, request):
        equipment_uuid = request.data.get('equipment_uuid')

        if not equipment_uuid:
            raise ValidationError('Equipment UUID is required')

        try:
            txn = TransactionService.create_return_request(
                user=request.user, equipment_uuid=equipment_uuid
            )
            return Response(
                TransactionSerializer(txn).data, status=status.HTTP_201_CREATED
            )
        except Equipment.DoesNotExist:
            raise ValidationError('Equipment not found') from None

    @action(
        detail=True,
        methods=['post'],
        url_path='approve-return',
        permission_classes=[IsManagerOrAdmin],
    )
    def approve_return(self, request, pk=None):
        # Prepare new location data if provided
        new_location_data = {}
        if 'location' in request.data:
            new_location_data['location'] = request.data['location']
        if 'zone' in request.data:
            new_location_data['zone'] = request.data['zone']
        if 'cabinet' in request.data:
            new_location_data['cabinet'] = request.data['cabinet']
        if 'number' in request.data:
            new_location_data['number'] = request.data['number']

        updated_txn = TransactionService.approve_transaction(
            admin_user=request.user,
            transaction_id=pk,
            new_location_data=new_location_data,
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='reject-return',
        permission_classes=[IsManagerOrAdmin],
    )
    def reject_return(self, request, pk=None):
        updated_txn = TransactionService.reject_transaction(
            admin_user=request.user,
            transaction_id=pk,
            rejection_reason=request.data.get('rejection_reason', 'Rejected'),
        )
        return Response(TransactionSerializer(updated_txn).data)

    @action(
        detail=False,
        methods=['post'],
        url_path='bulk-approve',
        permission_classes=[IsManagerOrAdmin],
    )
    def bulk_approve(self, request):
        transaction_ids = request.data.get('transaction_ids', [])
        admin_note = request.data.get('admin_note', 'Bulk approved')

        if not transaction_ids:
            raise ValidationError('No transaction IDs provided')

        results = {'success': [], 'failed': []}

        for txn_id in transaction_ids:
            try:
                TransactionService.approve_transaction(
                    admin_user=request.user,
                    transaction_id=txn_id,
                    admin_note=admin_note,
                )
                results['success'].append(txn_id)
            except Exception as e:
                results['failed'].append({'id': txn_id, 'error': str(e)})

        return Response(results)
