from django.urls import path
from .views import CreateGameView, PongGameView

urlpatterns = [
    path('api/create/', CreateGameView.as_view(), name='create_game'),
    path('api/pong/<str:room_name>/', PongGameView.as_view(), name='pong_game'),
]
