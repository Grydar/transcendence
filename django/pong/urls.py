from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_game_view, name='create_game'),
    path('pong/<str:room_name>/', views.pong_game_view, name='pong_game'),
]