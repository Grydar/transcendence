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
        try:
            # Convert num_players to an integer
            num_players = int(request.POST.get('num_players', 0))  # Default to 0 if not provided
        except ValueError:
            num_players = 0  # Handle invalid input
        
        # Check if num_players is 1, otherwise proceed with form validation
        if num_players == 1:
            # Create a party with AI
            party = Party.objects.create(
                creator=request.user,
                num_players=num_players,
                nbPlayer=1,  # The creator joins immediately
                status='in_progress'  # Set status to in_progress
            )
            return redirect('game:game', party_id=party.id)  # Redirect to the game
        
        # If the form is valid, save the party
        if form.is_valid():
            party = form.save(commit=False)
            party.creator = request.user
            party.save()
            return redirect('game:game', party_id=party.id)  # Redirect to the game

    else:
        form = CreatePartyForm()

    # Handle GET request
    parties = Party.objects.exclude(status='completed')
    return render(request, 'game/lobby.html', {
        'form': form,
        'parties': parties,
        'num_players': None  # Default to None for GET request
    })

def game(request, party_id):
    party = get_object_or_404(Party, id=party_id)
    return render(request, 'game/game.html', {
        'party_id': party_id,
        'user': request.user,
        'num_players': party.num_players,
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
