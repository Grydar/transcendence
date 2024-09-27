# Django/App/urls.py

from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home'),
    path('create/', views.create_game_view, name='create_game'),
    path('pong/<str:room_name>/', views.pong_game_view, name='pong_game'),
]