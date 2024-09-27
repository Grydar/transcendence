# Django/App/consumers.py

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'pong_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f'WebSocket connected: {self.channel_name} to room {self.room_group_name}')

        # Initialize game state
        self.game_state = {
            'ball': {'x': 400, 'y': 300, 'vx': 5, 'vy': 5},
            'paddles': {
                'left': {'y': 250},
                'right': {'y': 250}
            },
            'scores': {'left': 0, 'right': 0}
        }

        # Send initial game state to the client
        await self.send(text_data=json.dumps({
            'action': 'init',
            'data': self.game_state
        }))
        logger.debug(f'Sent initial game state: {self.game_state}')

        # Start the game loop
        self.game_task = asyncio.create_task(self.game_loop())

        # Notify other players
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_join',
                'message': 'A new player has joined the game.'
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f'WebSocket disconnected: {self.channel_name} from room {self.room_group_name}')

        # Cancel the game loop task
        if hasattr(self, 'game_task'):
            self.game_task.cancel()
            try:
                await self.game_task
            except asyncio.CancelledError:
                logger.debug('Game loop task cancelled')
                pass

        # Notify other players
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_leave',
                'message': 'A player has left the game.'
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        payload = data.get('data', {})

        logger.debug(f'Received action: {action}, data: {payload}')

        if action == 'move_paddle':
            paddle = payload.get('paddle')
            direction = payload.get('direction')

            if paddle in self.game_state['paddles']:
                if direction == 'up':
                    self.game_state['paddles'][paddle]['y'] -= 10
                elif direction == 'down':
                    self.game_state['paddles'][paddle]['y'] += 10

                # Clamp the paddle position within the canvas
                self.game_state['paddles'][paddle]['y'] = max(0, min(500, self.game_state['paddles'][paddle]['y']))

                logger.debug(f'Updated {paddle} paddle position: {self.game_state["paddles"][paddle]["y"]}')

                # Broadcast updated paddle position
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'update_paddle',
                        'paddle': paddle,
                        'y': self.game_state['paddles'][paddle]['y']
                    }
                )

    async def game_loop(self):
        try:
            while True:
                await asyncio.sleep(0.05)  # 20 times per second

                # Update ball position
                self.game_state['ball']['x'] += self.game_state['ball']['vx']
                self.game_state['ball']['y'] += self.game_state['ball']['vy']

                # Simple collision with top and bottom
                if self.game_state['ball']['y'] <= 0 or self.game_state['ball']['y'] >= 600:
                    self.game_state['ball']['vy'] *= -1
                    logger.debug(f'Ball velocity updated: vy={self.game_state["ball"]["vy"]}')

                # Collision with paddles
                if self.game_state['ball']['x'] <= 40:
                    if abs(self.game_state['ball']['y'] - self.game_state['paddles']['left']['y']) < 50:
                        self.game_state['ball']['vx'] *= -1
                        self.game_state['ball']['x'] = 40  # Prevent sticking
                        logger.debug('Ball collided with left paddle')
                elif self.game_state['ball']['x'] >= 760:
                    if abs(self.game_state['ball']['y'] - self.game_state['paddles']['right']['y']) < 50:
                        self.game_state['ball']['vx'] *= -1
                        self.game_state['ball']['x'] = 760  # Prevent sticking
                        logger.debug('Ball collided with right paddle')

                # Check for scoring
                if self.game_state['ball']['x'] < 0:
                    self.game_state['scores']['right'] += 1
                    logger.info(f'Player Right scored! Scores: {self.game_state["scores"]}')
                    self.reset_ball()
                elif self.game_state['ball']['x'] > 800:
                    self.game_state['scores']['left'] += 1
                    logger.info(f'Player Left scored! Scores: {self.game_state["scores"]}')
                    self.reset_ball()

                # Broadcast updated ball position and scores
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'update_ball',
                        'ball': self.game_state['ball'],
                        'scores': self.game_state['scores']
                    }
                )
        except asyncio.CancelledError:
            logger.info('Game loop cancelled')
            pass

    def reset_ball(self):
        self.game_state['ball'] = {'x': 400, 'y': 300, 'vx': 5, 'vy': 5}
        logger.debug('Ball reset to center')

    # Handlers for group messages
    async def update_paddle(self, event):
        paddle = event['paddle']
        y = event['y']

        logger.debug(f'Sending updated paddle position: {paddle} y={y}')

        await self.send(text_data=json.dumps({
            'action': 'update_paddle',
            'data': {
                'paddle': paddle,
                'y': y
            }
        }))

    async def update_ball(self, event):
        ball = event['ball']
        scores = event['scores']

        logger.debug(f'Sending updated ball position and scores: {ball}, {scores}')

        await self.send(text_data=json.dumps({
            'action': 'update_ball',
            'data': {
                'ball': ball,
                'scores': scores
            }
        }))

    async def player_join(self, event):
        message = event['message']

        logger.info(f'Player joined: {message}')

        await self.send(text_data=json.dumps({
            'action': 'player_join',
            'message': message
        }))

    async def player_leave(self, event):
        message = event['message']

        logger.info(f'Player left: {message}')

        await self.send(text_data=json.dumps({
            'action': 'player_leave',
            'message': message
        }))