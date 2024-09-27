# Django/App/views.py

from django.shortcuts import render, redirect
from django.urls import reverse
import uuid

def home_view(request):
    return render(request, 'home.html')  # Create a simple home page with options to create or join a game

def create_game_view(request):
    room_name = str(uuid.uuid4())[:8]  # Generate a unique 8-character room name
    return redirect(reverse('pong_game', args=[room_name]))

def pong_game_view(request, room_name):
    return render(request, 'pong.html', {'room_name': room_name})