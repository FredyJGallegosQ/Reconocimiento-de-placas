import time
from django.contrib.auth import authenticate, login
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, RegisteredPlateSerializer, PlateRecognitionRecordSerializer
from .models import CustomUser, RegisteredPlate, PlateRecognitionRecord
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
import cv2
import numpy as np
import easyocr
import torch
import pathlib
from django.utils.dateparse import parse_datetime
from django.db.models import Count
from django.db.models.functions import TruncMonth, TruncDay


class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            return Response({
                "username": user.username,
                "is_admin": user.is_admin,
                "is_user": user.is_user
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PlateRecognitionView(APIView):
    permission_classes = [AllowAny]
    # Cargar YOLOv5 al iniciar la clase
    pathlib.PosixPath = pathlib.WindowsPath
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='C:/Users/usuario/Desktop/Plan de tesis/PlateRecognition.pt')

    def post(self, request, *args, **kwargs):
        try:
            # Recuperar el archivo de imagen enviado como 'frame'
            frame_file = request.FILES.get('frame')
            if not frame_file:
                # Responder con un error si no se proporciona el frame
                return Response({"error": "No frame provided"}, status=400)

            # Leer el contenido del archivo y convertirlo en una imagen
            frame_data = frame_file.read()
            np_arr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is None:
                # Responder con un error si no se puede decodificar la imagen
                return Response({"error": "Failed to decode frame"}, status=400)
            
            # Reconocer las placas en el frame
            plate_numbers = self.recognize_plate(frame)
            #print("Lista de placas -->", plate_numbers)

            # Consultar las placas reconocidas en la base de datos
            registered_plates = RegisteredPlate.objects.filter(plate_number__in=plate_numbers)
            registered_plate_dict = {plate.plate_number: plate for plate in registered_plates}
            # print("Placas registradas en la BD:", registered_plates)
            # print("Placas registradas dict:", registered_plate_dict)
           
            # Preparar la respuesta
            response_data = []
            for plate_number in plate_numbers:
                if plate_number in registered_plate_dict:
                   # print("se encontró la placa en la BD")
                    plate_info = registered_plate_dict[plate_number]
                    #print("Información de la placa --> ", plate_info.name)

                    # Comprobar si la placa fue reconocida en los últimos 5 minutos
                    five_minutes_ago = timezone.now() - timedelta(minutes=5)
                    recent_record = PlateRecognitionRecord.objects.filter(
                        plate_number=plate_number,
                        recognized_at__gte=five_minutes_ago
                    ).exists()

                    if not recent_record:
                        # Registrar la placa en la base de datos si no fue reconocida recientemente
                        PlateRecognitionRecord.objects.create(
                            plate_number=plate_info.plate_number,
                            name=plate_info.name,
                            last_name=plate_info.last_name,
                            type=plate_info.type
                        )
                        response_data.append({
                            'plate_number': plate_info.plate_number,
                            'name': plate_info.name,
                            'last_name': plate_info.last_name,
                            'type': plate_info.type
                        })
                    else:
                        print(f"La placa {plate_number} fue reconocida recientemente (últimos 5 minutos)")

            #print("Responde data --> ", response_data)
            if response_data:
                # Responder con las placas reconocidas
                return Response({"plate_numbers": response_data})
            else:
                # Responder si no se encuentran placas registradas
                return Response({"message": "No registered plates found"}, status=404)

        except Exception as e:
            # Manejar errores y responder con el mensaje de error
            return Response({"error": str(e)}, status=400)

    def recognize_plate(self, frame):
        plate_numbers = []

        # Obtener predicciones de YOLO
        results = self.model(frame)  
        detected_plates = results.pandas().xyxy[0]  # Obtener resultados en formato DataFrame

        print(detected_plates)
        for _, row in detected_plates.iterrows():
            x1, y1, x2, y2, confidence, class_name = row[['xmin', 'ymin', 'xmax', 'ymax', 'confidence', 'name']]
            if confidence < 0.5 or class_name != "placa":
                continue  # Omitir detecciones no confiables  # Filtrar por confianza y categoría 'plate'
                # Extraer la placa detectada
            plate_img = frame[int(y1):int(y2), int(x1):int(x2)]

            gray_plate = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
            reader = easyocr.Reader(['en'], gpu=True) 
            plate_text = reader.readtext(gray_plate, detail=0)
            if not plate_text:
                continue  # Si no hay texto, omitir
            # Validar el formato de la placa
            if "S" in plate_text[1]:
                print("entro")
                plate_text.append(plate_text[1].replace("S", "5"))
                
            print("==================================================================== ", plate_text)
            for plate in plate_text:
                if len(plate) >= 7 and "-" in plate:
                    parts = plate.replace("\n", "").split("-")
                    right = parts[1]  
                    left = parts[0]  
                    if len(right) == 2:
                        plate = left[-4:] + "-" + right
                    elif len(right) == 3:
                        plate = left[-3:] + "-" + right
                    plate_numbers.append(plate.strip())
        return plate_numbers
    
class RegisterPlateView(generics.CreateAPIView):
    queryset = RegisteredPlate.objects.all()
    serializer_class = RegisteredPlateSerializer
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RegisteredPlateListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        plates = RegisteredPlate.objects.all()
        serializer = RegisteredPlateSerializer(plates, many=True)
        return Response(serializer.data)

class DeletePlateView(APIView):
    permission_classes = [AllowAny]
    def delete(self, request, plate_number):
        try:
            plate = RegisteredPlate.objects.get(plate_number=plate_number)
            plate.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RegisteredPlate.DoesNotExist:
            return Response({"error": "Plate not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Vista para listar usuarios
class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# Vista para eliminar un usuario
class UserDeleteView(generics.DestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'
    permission_classes = [AllowAny]

class PlateRecognitionReportView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = PlateRecognitionRecord.objects.all()
    serializer_class = PlateRecognitionRecordSerializer

class FrequencyByTypeView(generics.ListAPIView):
    permission_classes = [AllowAny]
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            records = PlateRecognitionRecord.objects.filter(
                recognized_at__range=[parse_datetime(start_date), parse_datetime(end_date)]
            )
        else:
            records = PlateRecognitionRecord.objects.all()

        # Agrupar por tipo y contar ocurrencias
        frequency_by_type = records.values('type').annotate(count=Count('id')).order_by('-count')

        return Response(frequency_by_type)
    
class TopFrequentUsersView(generics.ListAPIView):
    permission_classes = [AllowAny]
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            records = PlateRecognitionRecord.objects.filter(
                recognized_at__range=[parse_datetime(start_date), parse_datetime(end_date)]
            )
        else:
            records = PlateRecognitionRecord.objects.all()

        # Agrupar por placa y contar ocurrencias
        top_users = records.values('plate_number', 'name', 'last_name', 'type').annotate(count=Count('id')).order_by('-count')[:15]

        return Response(top_users)
    
class TrafficTrendsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        interval = request.query_params.get('interval', 'day')  # Por defecto, intervalo diario
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            records = PlateRecognitionRecord.objects.filter(
                recognized_at__range=[parse_datetime(start_date), parse_datetime(end_date)]
            )
        else:
            records = PlateRecognitionRecord.objects.all()

        if interval == 'month':
            trends = records.annotate(month=TruncMonth('recognized_at')).values('month').annotate(count=Count('id')).order_by('month')
        else:
            trends = records.annotate(day=TruncDay('recognized_at')).values('day').annotate(count=Count('id')).order_by('day')

        return Response(trends)
