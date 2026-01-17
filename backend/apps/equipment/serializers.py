from rest_framework import serializers

from apps.locations.models import Location
from apps.locations.serializers import LocationSerializer
from apps.users.serializers import UserSerializer

from .models import Attachment, Category, Equipment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_at']


class EquipmentSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    current_possession = serializers.SerializerMethodField()
    location_details = LocationSerializer(source='location', read_only=True)
    target_location_details = LocationSerializer(
        source='target_location', read_only=True
    )
    category_details = CategorySerializer(source='category', read_only=True)

    # Use standard ImageField to allow uploads
    image = serializers.ImageField(required=False, allow_null=True)

    # Explicitly define fields to handle empty strings from FormData
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'name',
            'description',
            'status',
            'category',
            'category_details',
            'location',
            'location_details',
            'target_location',
            'target_location_details',
            'zone',
            'cabinet',
            'number',
            'target_zone',
            'target_cabinet',
            'target_number',
            'image',
            'rdf_metadata',
            'created_at',
            'updated_at',
            'attachments',
            'current_possession',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Apply custom image URL logic for the output JSON
        image_url = ret.get('image')
        if image_url and 'backend:8000' in image_url:
            # If serving locally via Docker, the URL might be http://backend:8000/...
            ret['image'] = image_url.replace('http://backend:8000', '').replace(
                'https://backend:8000', ''
            )
        return ret

    def get_current_possession(self, obj):
        # We assume the 'transactions' related name is available
        last_txn = obj.transactions.order_by('-created_at').first()
        if last_txn and last_txn.action == 'BORROW' and last_txn.status == 'COMPLETED':
            return UserSerializer(last_txn.user).data
        return None

    def to_internal_value(self, data):
        # Create a mutable copy if it's a QueryDict
        data = data.dict() if hasattr(data, 'dict') else dict(data)

        # Convert empty strings to None for fields that don't accept empty strings
        for field in ['category', 'location', 'target_location']:
            if field in data and (data[field] == '' or data[field] == 'null'):
                data[field] = None

        # Handle image field from FormData
        if 'image' in data:
            image = data['image']

            # 1. Handle empty/null values
            if (
                image == ''
                or image == 'null'
                or hasattr(image, 'size')
                and image.size == 0
                or hasattr(image, 'name')
                and not image.name
            ):
                data['image'] = None

            # 2. Handle 'blob' filename without extension (common with frontend compression)
            elif hasattr(image, 'name') and image.name == 'blob':
                content_type = getattr(image, 'content_type', '')
                extension = ''
                if content_type == 'image/jpeg':
                    extension = '.jpg'
                elif content_type == 'image/png':
                    extension = '.png'
                elif content_type == 'image/webp':
                    extension = '.webp'

                if extension:
                    image.name = f'upload{extension}'

            # If still None, remove to avoid validation issues
            if data['image'] is None:
                del data['image']

        return super().to_internal_value(data)
