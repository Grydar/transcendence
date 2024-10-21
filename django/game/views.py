from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import Party, LeaderboardEntry, Tournament, TournamentMatch, GameStats, UserStats
from .forms import CreatePartyForm, CreateTournamentForm
from itertools import combinations
from django.db import transaction
from datetime import timedelta
import json, math, random

@login_required(login_url='/users/login/')
def lobby(request):
    if request.method == 'POST':
        form = CreatePartyForm(request.POST)
        
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

def game(request, party_id, match_id=None):
    party = get_object_or_404(Party, id=party_id)
    tournament_id = None
    if match_id:
        match = get_object_or_404(TournamentMatch, id=match_id)
        tournament_id = match.tournament.id
    return render(request, 'game/game.html', {
        'party_id': party_id,
        'match_id': match_id,
        'tournament_id': tournament_id,
        'user': request.user,
        'num_players': party.num_players,
    })

@csrf_exempt #temporary, remove once csrf token is added
@require_POST
# @login_required('login_url=/users/login/')
def submit_stats(request, match_id):
    try:
        data = json.loads(request.body)
        player1Score = data.get('player1Score')
        player2Score = data.get('player2Score')
        winner = data.get('winner')
        player1BallHits = data.get('player1BallHits')
        player2BallHits = data.get('player2BallHits')
        totalBallHits = data.get('totalBallHits')
        matchDuration = data.get('matchDuration')
        # match_id = data.get('match_id')
        
        # temp = GameStats.objects.get(match_id=match_id)
        
        game = GameStats.objects.create(
            player1=request.user,
            player2=User.objects.get(id=data.get('player2_id')),
            winner=winner,
            total_ball_hits=totalBallHits,
            match_duration=matchDuration,
            match_id=match_id
		)
        
        player1_stats = UserStats.objects.get(user=request.user)
        player2_stats = UserStats.objects.get(user=game.player2)
        
        player1_stats.times_ball_hit += player1BallHits
        player2_stats.times_ball_hit += player2BallHits
        
        player1_stats.total_score += player1Score
        player2_stats.total_score += player2Score

        if winner == player1_stats.user:
            player1_stats.wins += 1
            player2_stats.losses += 1
        elif winner == player2_stats.user:
            player2_stats.wins += 1
            player1_stats.losses += 1
            
        player1_stats.save()
        player2_stats.save()
        game.save()

        return JsonResponse({'status': 'success', "match_id": game.match_id})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required(login_url='/users/login/')
def view_game_stats(request, match_id):
    if request.method == 'GET':
        game = get_object_or_404(GameStats, match_id=match_id)
        return render(request, 'game/gamestats.html',
                      {
                          'game':game
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

@login_required(login_url='/users/login/')
def tournament_list(request):
    if request.method == 'POST':
        create_tournament_form = CreateTournamentForm(request.POST)
        if create_tournament_form.is_valid():
            tournament = create_tournament_form.save(commit=False)
            tournament.creator = request.user
            tournament.save()
            tournament.players.add(request.user)
            return redirect('game:tournament_detail', tournament_id=tournament.id)
    else:
        create_tournament_form = CreateTournamentForm()

    tournaments = Tournament.objects.filter(status='waiting')

    return render(request, 'game/tournament_list.html', {
        'create_tournament_form': create_tournament_form,
        'tournaments': tournaments,
    })

@login_required(login_url='/users/login/')
def join_tournament(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    if tournament.status != 'waiting':
        return HttpResponseForbidden("Cannot join a tournament that is not active.")
    tournament.players.add(request.user)
    return redirect('game:tournament_detail', tournament_id=tournament.id)

@login_required(login_url='/users/login/')
def tournament_detail(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    is_creator = tournament.creator == request.user
    can_start = is_creator and tournament.players.count() >= 2 and tournament.status == 'waiting'
    return render(request, 'game/tournament_detail.html', {
        'tournament': tournament,
        'is_creator': is_creator,
        'can_start': can_start,
    })

@require_POST
@login_required(login_url='/users/login/')
def start_tournament(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    if tournament.creator != request.user:
        return HttpResponseForbidden("Only the creator can start the tournament.")
    if tournament.players.count() < 2:
        return HttpResponseBadRequest("Not enough participants to start the tournament.")

    with transaction.atomic():
        tournament.status = 'in_progress'
        tournament.save()
        create_matchups(tournament)  # Ensure this is a synchronous call

    return redirect('game:tournament_progress', tournament_id=tournament.id)

@login_required(login_url='/users/login/')
def tournament_progress(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    matches = tournament.matches.all()  # assuming a related matches field

    # Add a participant check to each match
    for match in matches:
        match.is_participant = request.user == match.player1 or request.user == match.player2

    context = {
        'tournament': tournament,
        'matches': matches,
    }
    return render(request, 'game/tournament_progress.html', context)

def create_matchups(tournament):
    players = list(tournament.players.all())
    total_players = tournament.players.count()
    # If number of participants is not a power of 2, add byes
    next_power_of_two = 2 ** math.ceil(math.log2(total_players))
    byes = next_power_of_two - total_players
    # Shuffle participants for random matchups
    random.shuffle(players)
    # Add None as byes
    for _ in range(byes):
        players.append(None)
    # Create first round matchups
    for i in range(0, len(players), 2):
        player1 = players[i]
        player2 = players[i+1]
        if player1 and player2:
            TournamentMatch.objects.create(
                tournament=tournament,
                player1=player1,
                player2=player2,
                status='pending',
                round_number=1
            )
        elif player1 and not player2:
            # Handle bye: player1 automatically advances
            TournamentMatch.objects.create(
                tournament=tournament,
                player1=player1,
                player2=None,
                winner=player1,
                status='completed',
                round_number=1
            )

@login_required(login_url='/users/login/')
def play_match(request, tournament_id, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id, tournament_id=tournament_id)
    if match.status != 'pending':
        return HttpResponseBadRequest("Match already in progress or completed.")
    if request.user not in [match.player1, match.player2]:
        return HttpResponseForbidden("You are not a participant in this match.")

    if match.party:
        party = match.party
    else:
        # Create a new Party for the match
        party = Party.objects.create(
            creator=request.user,
            num_players=2,
            status='active'
        )
        # Add both players to the Party
        party.participants.add(match.player1, match.player2)
        # Associate the party with the match
        match.party = party
        match.save()

    return redirect('game:game_with_match', party_id=party.id, match_id=match.id,)

