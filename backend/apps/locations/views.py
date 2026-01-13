from rest_framework import filters, permissions, viewsets

from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        # Optional: Allow filtering by parent being null (root locations)
        parent_uuid = self.request.query_params.get('parent')
        if parent_uuid == 'null':
            queryset = queryset.filter(parent__isnull=True)
        elif parent_uuid:
            queryset = queryset.filter(parent__uuid=parent_uuid)
        return queryset
