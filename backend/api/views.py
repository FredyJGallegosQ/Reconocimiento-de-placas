import json
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerialazer, NoteSerialazer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note


from aiortc import RTCPeerConnection, RTCSessionDescription
from django.http import JsonResponse
from .processing import process_frame
import cv2


class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerialazer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author = user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author = self.request.user)
        else:
            print(serializer.errors)            

class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerialazer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author = user)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerialazer
    permission_classes = [AllowAny]


# Instancia del Peer Connection
pc = RTCPeerConnection()

@pc.on("track")
def on_track(track):
    if track.kind == "video":
        @track.on("data")
        def on_frame(frame):
            img = frame.to_ndarray(format="bgr24")
            processed_img = process_frame(img)
            # Aquí puedes enviar processed_img a donde lo necesites
            # Por ejemplo, guardar en el servidor, enviar a otro cliente, etc.

async def offer(request):
    params = json.loads(request.body)
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return JsonResponse({
        'sdp': pc.localDescription.sdp,
        'type': pc.localDescription.type,
    })