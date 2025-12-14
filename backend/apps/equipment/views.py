import qrcode
from io import BytesIO
from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Equipment
from .serializers import EquipmentSerializer
from apps.users.models import User
from apps.transactions.serializers import TransactionSerializer
from decouple import config

class IsManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.role in [User.Role.MANAGER, User.Role.ADMIN] or request.user.is_staff
        )

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'status', 'created_at']
    ordering = ['-created_at']
    lookup_field = 'uuid'

    def get_queryset(self):
        queryset = Equipment.objects.all()
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')
        
        if category:
            queryset = queryset.filter(category=category)
        if status:
            queryset = queryset.filter(status=status)
            
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