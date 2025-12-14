from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GoogleLoginView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('', include(router.urls)),
]
