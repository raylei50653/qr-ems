from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.users.views import RegisterView  # Import RegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
    # API V1 Auth
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path(
        'api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'
    ),
    path(
        'api/v1/auth/register/', RegisterView.as_view(), name='register'
    ),  # Added registration path
    # Apps
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.equipment.urls')),
    path('api/v1/', include('apps.transactions.urls')),
    path('api/v1/locations/', include('apps.locations.urls')),
    # Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/schema/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
