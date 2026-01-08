from rest_framework import serializers
from .models import Equipment, Attachment
from apps.users.serializers import UserSerializer
from apps.locations.serializers import LocationSerializer

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_at']

class EquipmentSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    current_possession = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    location_details = LocationSerializer(source='location', read_only=True)
    target_location_details = LocationSerializer(source='target_location', read_only=True)
    
    class Meta:
        model = Equipment
        fields = [
            'uuid', 'name', 'description', 'status', 'category',
            'location', 'location_details',
            'target_location', 'target_location_details',
            'zone', 'cabinet', 'number', 'image',
            'rdf_metadata', 'created_at', 'updated_at',
            'attachments', 'current_possession'
        ]

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_current_possession(self, obj):
        # We assume the 'transactions' related name is available
        last_txn = obj.transactions.order_by('-created_at').first()
        if last_txn and last_txn.action == 'BORROW' and last_txn.status == 'COMPLETED':
            return UserSerializer(last_txn.user).data
        return None
