from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import uuid

class CreateGameView(APIView):
    def get(self, request, format=None):
        room_name = str(uuid.uuid4())[:8]  # Generate a unique room name
        return Response({'room_name': room_name}, status=status.HTTP_201_CREATED)

class PongGameView(APIView):
    def get(self, request, room_name, format=None):
        # Send the room_name in a JSON response
        return Response({'room_name': room_name})
