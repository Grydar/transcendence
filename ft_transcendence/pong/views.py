from django.shortcuts import render

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout

# Register a new user
def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        User.objects.create_user(username=username, password=password)
        return JsonResponse({'status': 'User created'})
    
# Login a user
def user_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return JsonResponse({'status': 'User logged in'})
        else:
            return JsonResponse({'status': 'Invalid credentials'}, status=401)
    elif request.method == 'GET':
        return JsonResponse({'message': 'This endpoint expects a POST request for login.'})
