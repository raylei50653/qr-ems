from rest_framework import serializers

from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    full_path = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            'uuid',
            'name',
            'description',
            'parent',
            'full_path',
            'children',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['uuid', 'created_at', 'updated_at']

    def get_full_path(self, obj):
        return str(obj)

    def get_children(self, obj):
        children = obj.children.all()
        return LocationSerializer(children, many=True).data
