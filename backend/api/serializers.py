from rest_framework import serializers
from .models import CustomUser, RegisteredPlate, PlateRecognitionRecord
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = CustomUser
        fields = ["username", "password", "is_admin", "is_user"]
        extra_kwargs = {
            'password': {'write_only': True},
        }
    def create(self, validate_data):
        print(validate_data)
        password = validate_data.pop('password', None)
        user = CustomUser(**validate_data)
        if password:
            user.set_password(password)
        user.save()
        return user
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Agregar los campos adicionales
        data.update({
            'is_admin': self.user.is_admin,
            'is_user': self.user.is_user,
        })
        
        return data
    
class RegisteredPlateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegisteredPlate
        fields = '__all__'

class PlateRecognitionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlateRecognitionRecord
        fields = ['plate_number', 'name', 'last_name', 'type', 'recognized_at']