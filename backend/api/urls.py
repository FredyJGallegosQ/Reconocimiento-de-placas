from django.urls import path
from .views import RegisterView, LoginView, CustomTokenObtainPairView, PlateRecognitionView
from .views import RegisterPlateView, RegisteredPlateListView, DeletePlateView, UserListView, UserDeleteView
from .views import PlateRecognitionReportView, FrequencyByTypeView, TopFrequentUsersView
from .views import TrafficTrendsView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('recognize_plate/', PlateRecognitionView.as_view(), name='recognize_plate'),
    path('register_plate/', RegisterPlateView.as_view(), name='register_plate'),
    path('registered_plates/', RegisteredPlateListView.as_view(), name='registered_plates'),
    path('delete_plate/<str:plate_number>/', DeletePlateView.as_view(), name='delete_plate'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('delete_user/<str:username>/', UserDeleteView.as_view(), name='user-delete'),
    path('plate_report/', PlateRecognitionReportView.as_view(), name='plate_report'),
    path('analysis/frequency-by-type/', FrequencyByTypeView.as_view(), name='frequency-by-type'),
    path('analysis/top-frequent-users/', TopFrequentUsersView.as_view(), name='top-frequent-users'),
    path('analysis/traffic-trends/', TrafficTrendsView.as_view(), name='traffic-trends')
]