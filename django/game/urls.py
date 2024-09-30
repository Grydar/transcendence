from django.urls import path
from .views import game, lobby, submit_game_result
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('', lobby, name='lobby'),
    path('<int:party_id>/', game, name='game'),
    path('submit_result/', submit_game_result, name='submit_game_result'),  # New endpoint
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
