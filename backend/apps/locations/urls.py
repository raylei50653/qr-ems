from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LocationViewSet

router = DefaultRouter()
router.register(r'', LocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
