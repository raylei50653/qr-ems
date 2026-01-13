from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, EquipmentViewSet

router = DefaultRouter()
router.register(r'equipment', EquipmentViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
