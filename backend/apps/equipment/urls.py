from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EquipmentViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'equipment', EquipmentViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
