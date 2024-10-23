from django.urls import path
from . import views

<<<<<<< HEAD
urlpatterns = [
    path('', views.chat_page),
    path('create_room/', views.create_room, name='create_room'),
=======
app_name = 'chat'

urlpatterns = [
    path('', views.chat_page, name='home'),
    path('create_room/', views.create_room, name='create_room'),
	path('send_game_invite/', views.send_game_invite, name='send_game_invite'),
>>>>>>> origin/main
    path('<str:slug>/', views.room, name='room'),
]