from django.contrib.auth import authenticate, login
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, RegisteredPlateSerializer
from .models import CustomUser, RegisteredPlate
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
                    response_data.append({
                        'plate_number': plate_info.plate_number,
                        'name': plate_info.name,
                        'last_name': plate_info.last_name,
                        'occupation': plate_info.occupation
                    })
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
        x1 = int(an / 3)
        x2 = int(x1 * 2)

        y1 = int(al / 3)
        y2 = int(y1 * 2)

        # Recorte de zona extraida
        recorte = frame[y1:y2, x1:x2]

        # Preparaación de zona de interés
        nB = np.matrix(recorte[:, :, 0])
        nG = np.matrix(recorte[:, :, 1])
        nR = np.matrix(recorte[:, :, 2])

        # Color
        Color = cv2.absdiff(nG, nB)

        # Binarizamos la imagen
        _, umbral = cv2.threshold(Color, 40, 255, cv2.THRESH_BINARY)

        # Extraemos contornos zona seleccionada
        contornos, _ = cv2.findContours(umbral, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        # Ordenamos de grande a pequeño
        contornos = sorted(contornos, key = lambda x: cv2.contourArea(x), reverse=True)

        # Dibuja contorno extraido
        for contorno in contornos:
            area = cv2.contourArea(contorno)
            if area > 500 and area < 5000:
                # Detecta la placa
                x, y, ancho, alto = cv2.boundingRect(contorno)

                # Extracción de coordenadas
                xpi = x + x1
                ypi = y + y1

                xpf = x + ancho + x1
                ypf = y + alto + y1

                # Extraer pixeles
                placa = frame[ypi:ypf, xpi:xpf]

                # Asegurar de tener un buen tamaño de placa
                if placa.shape[0] >= 30 and placa.shape[1] >= 50:
                    gray_plate = cv2.cvtColor(placa, cv2.COLOR_BGR2GRAY)
                    custom_config = r'--oem 1 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
                    texto = pytesseract.image_to_string(gray_plate, config=custom_config)
                    if len(texto) >= 7:
                        plate_numbers.append(texto.strip())
        return plate_numbers
    
class RegisterPlateView(generics.CreateAPIView):
    queryset = RegisteredPlate.objects.all()
    serializer_class = RegisteredPlateSerializer

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