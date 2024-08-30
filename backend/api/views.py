from django.contrib.auth import authenticate, login
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.views import APIView
import cv2
import numpy as np
from django.utils.datastructures import MultiValueDictKeyError
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import os
import time

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
            
            # # Mostrar el frame en una ventana flotante
            # cv2.imshow('Frame', frame)
            # cv2.waitKey(10)  # Espera 0.1 segundos
            # cv2.destroyWindow('Frame')  # Cierra la ventana

            plate_numbers = self.recognize_plate(frame)
            
            return Response({"plate_numbers": plate_numbers})
        
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
                    print("Placa -->", texto)
                    if len(texto) >= 7:
                        plate_numbers.append(texto.strip())
        print("Lista de placas -->", plate_numbers)
        return plate_numbers