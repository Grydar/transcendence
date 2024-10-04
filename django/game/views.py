from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from .models import Party, LeaderboardEntry  # Ensure LeaderboardEntry model exists
from .forms import CreatePartyForm  # Import CreatePartyForm
import json

@login_required(login_url='/users/login/')
def lobby(request):
    if request.method == 'POST':
        form = CreatePartyForm(request.POST)
        if form.is_valid():
            party = form.save(commit=False)
            party.creator = request.user
            party.save()
            return redirect('game:game', party_id=party.id)  # Redirect to game with party ID
    else:
        form = CreatePartyForm()
    parties = Party.objects.all()
    return render(request, 'game/lobby.html', {'form': form, 'parties': parties})

def game(request, party_id):
    party = get_object_or_404(Party, id=party_id)
    return render(request, 'game/game.html', {
        'party_id': party_id,
        'user': request.user
    })

@require_POST
@login_required(login_url='/users/login/')
def submit_game_result(request):
    try:
        data = json.loads(request.body)
        party_id = data.get('party_id')
        player_score = data.get('player_score')
        opponent_score = data.get('opponent_score')
        
        if not all([party_id, player_score is not None, opponent_score is not None]):
            return HttpResponseBadRequest("Missing required fields.")
        
        party = get_object_or_404(Party, id=party_id)
        
        # Create a new leaderboard entry
        LeaderboardEntry.objects.create(
            user=request.user,
            party=party,
            player_score=player_score,
            opponent_score=opponent_score
        )
        
        return JsonResponse({'status': 'success'})
    
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON.")
