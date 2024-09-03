from django.urls import path
from .views import RegisterView, LoginView, CustomTokenObtainPairView, PlateRecognitionView
from .views import RegisterPlateView, RegisteredPlateListView, DeletePlateView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('recognize_plate/', PlateRecognitionView.as_view(), name='recognize_plate'),
    path('register_plate/', RegisterPlateView.as_view(), name='register_plate'),
    path('registered_plates/', RegisteredPlateListView.as_view(), name='registered_plates'),
    path('delete_plate/<str:plate_number>/', DeletePlateView.as_view(), name='delete_plate'),
]