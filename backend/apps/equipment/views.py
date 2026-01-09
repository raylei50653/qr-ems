import qrcode
from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Equipment, Category
from .serializers import EquipmentSerializer, CategorySerializer
from apps.users.models import User
from apps.transactions.serializers import TransactionSerializer
from apps.transactions.models import Transaction
from apps.locations.models import Location
from decouple import config

class IsManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff
        )

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'status', 'created_at']
    ordering = ['-created_at']
    lookup_field = 'uuid'

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        old_location = old_instance.location
        old_zone = old_instance.zone
        old_cabinet = old_instance.cabinet
        old_number = old_instance.number

        instance = serializer.save()
        
        new_status = instance.status
        new_location = instance.location
        new_zone = instance.zone
        new_cabinet = instance.cabinet
        new_number = instance.number
        
        action_type = None
        reason = ""

        # Status based transitions
        if old_status != new_status:
            if new_status == Equipment.Status.IN_TRANSIT:
                action_type = 'MOVE_START'
                reason = f"Status changed from {old_status} to {new_status}"
            elif old_status == Equipment.Status.IN_TRANSIT and new_status == Equipment.Status.AVAILABLE:
                action_type = 'MOVE_CONFIRM'
                reason = f"Status changed from {old_status} to {new_status}"
        
        # Location based transitions (Direct Move or Correction)
        # Only log if action_type is not yet set (to avoid double logging if covered by status change)
        if not action_type and new_status == Equipment.Status.AVAILABLE:
            location_changed = (old_location != new_location) or \
                               (old_zone != new_zone) or \
                               (old_cabinet != new_cabinet) or \
                               (old_number != new_number)
            
            if location_changed:
                action_type = 'MOVE_CONFIRM' # Treat direct location change as immediate move confirmation
                reason = "Direct location update"
        
        if action_type:
            # Create a transaction record with location snapshot
            image = self.request.FILES.get('transaction_image')
            Transaction.objects.create(
                equipment=instance,
                user=self.request.user,
                action=action_type,
                status=Transaction.Status.COMPLETED,
                image=image,
                location=instance.location,
                zone=instance.zone,
                cabinet=instance.cabinet,
                number=instance.number,
                reason=reason
            )

    def get_queryset(self):
        queryset = Equipment.objects.all()
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')
        location = self.request.query_params.get('location')
        target_location = self.request.query_params.get('target_location')
        
        if category:
            queryset = queryset.filter(category=category)
        if status:
            queryset = queryset.filter(status=status)
        if location:
            try:
                target_loc = Location.objects.get(uuid=location)
                descendants = [target_loc.uuid]
                queue = [target_loc]
                while queue:
                    current = queue.pop(0)
                    children = current.children.all()
                    for child in children:
                        descendants.append(child.uuid)
                        queue.append(child)
                queryset = queryset.filter(location__uuid__in=descendants)
            except Location.DoesNotExist:
                queryset = queryset.none()
        if target_location:
            queryset = queryset.filter(target_location__uuid=target_location)
            
        return queryset

    @action(detail=True, methods=['get'])
    def history(self, request, uuid=None):
        equipment = self.get_object()
        transactions = equipment.transactions.all().order_by('-created_at')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def qr(self, request, uuid=None):
        equipment = self.get_object()
        # Data to encode: URL to frontend scan page
        frontend_url = config('FRONTEND_URL', default='http://localhost:5173')
        data = f"{frontend_url}/scan/{equipment.uuid}" 
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        
        return HttpResponse(buffer.getvalue(), content_type="image/png")

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        uuids = request.data.get('uuids', [])
        if not uuids:
            return Response({'detail': 'No UUIDs provided'}, status=400)
        
        deleted_count, _ = Equipment.objects.filter(uuid__in=uuids).delete()
        return Response({'detail': f'Successfully deleted {deleted_count} items'}, status=200)
