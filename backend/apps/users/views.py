from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Check for role update permission
        if 'role' in serializer.validated_data:
            user = self.request.user
            # Check if user is explicitly ADMIN role or Django superuser
            is_admin = (hasattr(user, 'role') and user.role == 'ADMIN') or user.is_superuser
            
            if not is_admin:
                # If they try to change role but aren't admin, ignore the role change or raise error
                # Raising error is safer/clearer
                raise PermissionDenied("You do not have permission to change user roles.")
        
        serializer.save()

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Optionally, return JWT tokens directly after registration
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            print("Google Login Error: No token provided")
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the token with Google
            # Note: In production, you should verify the AUDIENCE (CLIENT_ID) here too
            # Adding clock_skew_in_seconds to handle slight time differences between Docker and Google
            id_info = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(),
                clock_skew_in_seconds=10
            )
            print(f"Google Token Verified: {id_info.get('email')}")

            email = id_info.get('email')
            name = id_info.get('name', '')
            
            if not email:
                return Response({'error': 'Invalid token: no email found'}, status=status.HTTP_400_BAD_REQUEST)

            # Find or Create User
            User = get_user_model()
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create a new user
                # We use email as username or generate a unique one
                username = email.split('@')[0]
                # Handle username collision simply for now
                if User.objects.filter(username=username).exists():
                    username = f"{username}_{User.objects.count()}"
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    role='USER' # Default role
                )
                user.set_unusable_password()
                user.save()

            # Generate JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        except ValueError as e:
            print(f"Google Token Verification Failed: {str(e)}")
            return Response({'error': f'Token verification failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)