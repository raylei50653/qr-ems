from rest_framework import serializers
from .models import Transaction
from apps.users.serializers import UserSerializer
from apps.equipment.serializers import EquipmentSerializer
from apps.locations.serializers import LocationSerializer

class TransactionSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    equipment_detail = EquipmentSerializer(source='equipment', read_only=True)
    admin_verifier_detail = UserSerializer(source='admin_verifier', read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'action', 'status', 'due_date', 'reason', 'image',
            'equipment', 'user', 'admin_verifier',
            'location', 'location_details', 'zone', 'cabinet', 'number',
            'user_detail', 'equipment_detail', 'admin_verifier_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'admin_verifier', 'user'] # Status managed via actions
    
    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def create(self, validated_data):
        # Auto-assign current user as requester
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)
