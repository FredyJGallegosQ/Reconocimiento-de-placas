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
import pytesseract
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

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

    def post(self, request, *args, **kwargs):
        try:
            frame_file = request.FILES.get('frame')
            if not frame_file:
                return Response({"error": "No frame provided"}, status=400)

            frame_data = frame_file.read()
            np_arr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is None:
                return Response({"error": "Failed to decode frame"}, status=400)
            
            plate_numbers = self.recognize_plate(frame)
            print("Lista de placas -->", plate_numbers)

            # Buscar placas registradas en la base de datos
            registered_plates = RegisteredPlate.objects.filter(plate_number__in=plate_numbers)
            registered_plate_dict = {plate.plate_number: plate for plate in registered_plates}
            print("Placas registradas en la BD:", registered_plates)
            print("Placas registradas dict:", registered_plate_dict)
            # Preparar la respuesta
            response_data = []
            for plate_number in plate_numbers:
                if plate_number in registered_plate_dict:
                    print("se encontró la placa en la BD")
                    plate_info = registered_plate_dict[plate_number]
                    print("Información de la placa --> ", plate_info.name)
                    # Comprobar si la placa fue registrada en los últimos 5 minutos
                    five_minutes_ago = timezone.now() - timedelta(minutes=5)
                    recent_record = PlateRecognitionRecord.objects.filter(
                        plate_number=plate_number,
                        recognized_at__gte=five_minutes_ago
                    ).exists()

                    if not recent_record:
                        # Guardar la información en la base de datos
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

            print("Responde data --> ", response_data)
            if response_data:
                return Response({"plate_numbers": response_data})
            else:
                return Response({"message": "No registered plates found"}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def recognize_plate(self, frame):
        plate_numbers = []
        # Aquí va tu código de reconocimiento de placa
        # Ancho y alto de fotogramas
        al, an, c = frame.shape

        # Centro de la imagen
        x1 = int(an / 4)
        x2 = int(3 * an / 4)

        y1 = int(al / 1.5)
        y2 = al

        # Recorte de zona extraida
        recorte = frame[y1:y2, x1:x2]

        hsv_recorte = cv2.cvtColor(recorte, cv2.COLOR_BGR2HSV)

        # Rango de colores para amarillo, blanco y celeste
        masks = [
            cv2.inRange(hsv_recorte, np.array([20, 100, 100]), np.array([30, 255, 255])), # Amarillo
            cv2.inRange(hsv_recorte, np.array([0, 0, 200]), np.array([180, 25, 255])),   # Blanco
            cv2.inRange(hsv_recorte, np.array([85, 100, 100]), np.array([95, 255, 255])) # Celeste
        ]
        
        combined_mask = cv2.bitwise_or(masks[0], masks[1])
        combined_mask = cv2.bitwise_or(combined_mask, masks[2])

        contornos, _ = cv2.findContours(combined_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contornos = sorted(contornos, key=lambda x: cv2.contourArea(x), reverse=True)

        # Dibuja contorno extraido
        for contorno in contornos:
            area = cv2.contourArea(contorno)
            if 200 < area < 5000:
                x, y, ancho, alto = cv2.boundingRect(contorno)
                xpi, ypi = x + x1, y + y1
                xpf, ypf = x + ancho + x1, y + alto + y1
                placa = frame[ypi:ypf, xpi:xpf]

                if placa.shape[0] >= 30 and placa.shape[1] >= 50:
                    kernel = np.ones((3, 3), np.uint8)
                    plate_processed = cv2.dilate(placa, kernel, iterations=1)
                    plate_processed = cv2.erode(plate_processed, kernel, iterations=1)
                    gray_plate = cv2.cvtColor(plate_processed, cv2.COLOR_BGR2GRAY)

                    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789-'
                    texto = pytesseract.image_to_string(gray_plate, config=custom_config)
                    if len(texto) >= 7 and "-" in texto:
                            parts = texto.replace("\n", "").split("-")
                            rigth = parts[1]  
                            left = parts[0]  
                            if len(rigth) == 2:
                                 texto = left[-4:] + "-" + rigth
                            elif len(rigth) == 3:
                                 texto = left[-3:] + "-" + rigth
                            plate_numbers.append(texto.strip())
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