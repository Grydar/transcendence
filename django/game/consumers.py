# game/consumers.py

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from .models import Party, LeaderboardEntry

User = get_user_model()

class PongConsumer(AsyncWebsocketConsumer):
    ball_radius = 10
    paddle_width = 10
    paddle_height = 100
    game_loop = None

    game_states = {}

    @database_sync_to_async
    def get_username(self, user_id):
        try:
            user = User.objects.get(id=user_id)
            return user.username
        except User.DoesNotExist:
            return 'Unknown User'

    async def connect(self):
        self.party_id = self.scope['url_route']['kwargs']['party_id']
        self.room_group_name = f'pong_{self.party_id}'
        self.game_loop_task = None
        self.user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

        # Get the party's num_players
        self.num_players = await self.get_party_num_players(self.party_id)
        if self.num_players is None:
            await self.close()
            return

        # Join the group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Update party player count
        await self.update_party_on_connect(self.party_id)

        # Initialize game state
        if self.room_group_name not in PongConsumer.game_states:
            PongConsumer.game_states[self.room_group_name] = {
                'players': [],
                'paddle_positions': {},
                'scores': {},
                'ball': {
                    'x': 400,
                    'y': 300,
                    'speed_x': 10,
                    'speed_y': 10,
                },
                'game_started': False,
                'num_players': self.num_players,
                'game_loop_started': False,
            }

        game_state = PongConsumer.game_states[self.room_group_name]

        # Add player to the game
        if self.user_id not in game_state['players'] and len(game_state['players']) < game_state['num_players']:
            game_state['players'].append(self.user_id)
            game_state['paddle_positions'][self.user_id] = 250
            game_state['scores'][self.user_id] = 0

        # Send user ID to the client
        await self.send(text_data=json.dumps({
            'action': 'set_user_id',
            'user_id': self.user_id,
        }))

        # Start game if enough players have joined
        if len(game_state['players']) == game_state['num_players'] and not game_state['game_started']:
            game_state['game_started'] = True

            # Retrieve usernames
            player_usernames = {}
            for player_id in game_state['players']:
                username = await self.get_username(player_id)
                player_usernames[player_id] = username

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'start_game',
                    'player_ids': game_state['players'],
                    'player_usernames': player_usernames,
                    'countdown_duration': 3,
                }
            )
            if not game_state['game_loop_started']:
                game_state['game_loop_started'] = True
                asyncio.create_task(self.start_game_loop_with_delay(countdown_duration=3))

    async def start_game_loop_with_delay(self, countdown_duration):
        await asyncio.sleep(countdown_duration + 0.5)  # Wait for countdown + 'GO!' display time
        self.game_loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    # Wrap the entire block in a try-except to catch KeyError
        try:
            game_state = PongConsumer.game_states[self.room_group_name]
            if self.user_id in game_state.get('players', []):
                game_state['players'].remove(self.user_id)
                game_state['paddle_positions'].pop(self.user_id, None)
                game_state['scores'].pop(self.user_id, None)
            if not game_state.get('players'):
                del PongConsumer.game_states[self.room_group_name]
        except KeyError:
            pass

        # Update party info
        await self.update_party_on_disconnect(self.party_id)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'move_paddle':
            paddleY = data.get('paddleY')
            game_state = PongConsumer.game_states[self.room_group_name]
            game_state['paddle_positions'][self.user_id] = paddleY

    async def start_game(self, event):
        await self.send(text_data=json.dumps({
            'action': 'start_game',
            'player_ids': event['player_ids'],
            'player_usernames': event['player_usernames'],
            'countdown_duration': event.get('countdown_duration', 3),
        }))

    def increase_ball_speed(self, speed_x, speed_y, max_speed, speed_increment):
        # Increase speed while keeping the direction
        new_speed_x = speed_x * speed_increment
        new_speed_y = speed_y * speed_increment

        # Cap the speeds to the maximum allowed speed
        if abs(new_speed_x) > max_speed:
            new_speed_x = max_speed if new_speed_x > 0 else -max_speed
        if abs(new_speed_y) > max_speed:
            new_speed_y = max_speed if new_speed_y > 0 else -max_speed

        return new_speed_x, new_speed_y

    async def game_loop(self):
        game_state = PongConsumer.game_states[self.room_group_name]
        ball = game_state['ball']
        paddle_positions = game_state['paddle_positions']
        players = game_state['players']
        scores = game_state['scores']

        # Define the maximum speed and speed increment
        max_speed = 15  # Maximum speed the ball can reach
        speed_increment = 1.1  # Speed multiplier on each paddle hit

        while True:
            # Update ball position
            ball['x'] += ball['speed_x']
            ball['y'] += ball['speed_y']

            # Collision with top and bottom walls
            if ball['y'] - self.ball_radius <= 0:
                ball['y'] = self.ball_radius
                ball['speed_y'] *= -1

            if ball['y'] + self.ball_radius >= 600:
                ball['y'] = 600 - self.ball_radius
                ball['speed_y'] *= -1

            # Collision with paddles
            # Player one paddle collision
            if ball['x'] - self.ball_radius <= self.paddle_width:
                paddle1Y = paddle_positions.get(players[0], 250)
                if paddle1Y <= ball['y'] <= paddle1Y + self.paddle_height:
                    ball['x'] = self.paddle_width + self.ball_radius
                    ball['speed_x'] *= -1

                    # Increase ball speed
                    ball['speed_x'], ball['speed_y'] = self.increase_ball_speed(ball['speed_x'], ball['speed_y'], max_speed, speed_increment)

                else:
                    # Player two scores
                    scores[players[1]] += 1
                    if scores[players[1]] >= 5:
                        await self.end_game(winner=players[1], scores=scores)
                        break
                    else:
                        await self.reset_ball()
            # Player two paddle collision
            elif ball['x'] + self.ball_radius >= 800 - self.paddle_width:
                paddle2Y = paddle_positions.get(players[1], 250)
                if paddle2Y <= ball['y'] <= paddle2Y + self.paddle_height:
                    ball['x'] = 800 - self.paddle_width - self.ball_radius
                    ball['speed_x'] *= -1

                    # Increase ball speed
                    ball['speed_x'], ball['speed_y'] = self.increase_ball_speed(ball['speed_x'], ball['speed_y'], max_speed, speed_increment)

                else:
                    # Player one scores
                    scores[players[0]] += 1
                    if scores[players[0]] >= 5:
                        await self.end_game(winner=players[0], scores=scores)
                        break
                    else:
                        await self.reset_ball()

            # Broadcast the game state to both players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'update_state',
                    'ballX': ball['x'],
                    'ballY': ball['y'],
                    'paddle1Y': paddle_positions.get(players[0], 250),
                    'paddle2Y': paddle_positions.get(players[1], 250),
                    'score1': scores[players[0]],
                    'score2': scores[players[1]],
                }
            )

            await asyncio.sleep(0.016)  # Approximately 60 frames per second

    async def reset_ball(self):
        # Reset the ball to the center
        game_state = PongConsumer.game_states[self.room_group_name]
        ball = game_state['ball']
        ball['x'] = 400
        ball['y'] = 300

        # Reset ball speed to initial values
        initial_speed_x = 10
        initial_speed_y = 10

        # Invert direction of speed_x to alternate serving player
        ball['speed_x'] = initial_speed_x if ball['speed_x'] < 0 else -initial_speed_x
        ball['speed_y'] = initial_speed_y

        # Brief pause before resuming
        await asyncio.sleep(1)

    async def update_state(self, event):
        await self.send(text_data=json.dumps({
            'action': 'update_state',
            'ballX': event['ballX'],
            'ballY': event['ballY'],
            'paddle1Y': event['paddle1Y'],
            'paddle2Y': event['paddle2Y'],
            'score1': event['score1'],
            'score2': event['score2'],
        }))

    async def end_game(self, winner, scores):
        # Notify players about the game result
        game_state = PongConsumer.game_states[self.room_group_name]
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'winner': winner,
                'scores': scores,
                'players': game_state['players'],  # Include players in the event
            }
        )
        # Update user profiles
        await self.update_user_profiles(winner, scores)

        # Create LeaderboardEntry for both players
        await self.create_leaderboard_entries(self.party_id, game_state['players'], scores)

        # Cancel the game loop task if it's still running
        if self.game_loop_task and not self.game_loop_task.done():
            self.game_loop_task.cancel()
            try:
                await self.game_loop_task
            except asyncio.CancelledError:
                pass

        # Clean up game state
        del PongConsumer.game_states[self.room_group_name]

        # Remove all users from the group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Set party status to 'completed'
        await self.set_party_completed(self.party_id)

    async def game_over(self, event):
        winner = event['winner']
        scores = event['scores']
        players = event['players']  # Retrieve the list of players
        await self.send(text_data=json.dumps({
            'action': 'game_over',
            'message': 'You win!' if self.user_id == winner else 'You lose!',
            'score1': scores[players[0]],  # Ensure score1 corresponds to players[0]
            'score2': scores[players[1]],  # Ensure score2 corresponds to players[1]
        }))

    @database_sync_to_async
    def get_party_num_players(self, party_id):
        try:
            party = Party.objects.get(id=party_id)
            return party.num_players
        except Party.DoesNotExist:
            return None

    @database_sync_to_async
    def update_party_on_connect(self, party_id):
        try:
            party = Party.objects.get(id=party_id)
            party.nbPlayer += 1
            if party.nbPlayer >= party.num_players:
                party.status = 'in_progress'
            party.save()
        except Party.DoesNotExist:
            pass

    @database_sync_to_async
    def update_party_on_disconnect(self, party_id):
        try:
            party = Party.objects.get(id=party_id)
            if party.status != 'completed':
                party.nbPlayer -= 1
                if party.nbPlayer <= 0:
                    party.status = 'active'
                party.save()
        except Party.DoesNotExist:
            pass

    @database_sync_to_async
    def set_party_completed(self, party_id):
        try:
            party = Party.objects.get(id=party_id)
            party.status = 'completed'
            party.save()
        except Party.DoesNotExist:
            pass

    @database_sync_to_async
    def create_leaderboard_entries(self, party_id, players, scores):
        try:
            party = Party.objects.get(id=party_id)
            if len(players) != 2:
                print("Not a two-player game, cannot create LeaderboardEntry")
                return
            player1_id, player2_id = players
            user1 = User.objects.get(id=player1_id)
            user2 = User.objects.get(id=player2_id)
            score1 = scores[player1_id]
            score2 = scores[player2_id]

            # Create LeaderboardEntry for player1
            LeaderboardEntry.objects.create(
                user=user1,
                opponent=user2,
                party=party,
                player_score=score1,
                opponent_score=score2
            )
            # Create LeaderboardEntry for player2
            LeaderboardEntry.objects.create(
                user=user2,
                opponent=user1,
                party=party,
                player_score=score2,
                opponent_score=score1
            )
        except Exception as e:
            print(f"Error creating LeaderboardEntry: {e}")

    async def update_user_profiles(self, winner_id, scores):
        # Update win/lose data in user profiles
        players = [winner_id] + [uid for uid in scores if uid != winner_id]
        for user_id in players:
            try:
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                profile = await database_sync_to_async(lambda: user.profile)()
                if user_id == winner_id:
                    profile.wins += 1
                else:
                    profile.losses += 1
                await database_sync_to_async(profile.save)()
            except User.DoesNotExist:
                pass
