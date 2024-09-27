all: up

up:
	docker-compose up --build

migrate:
	python3 manage.py migrate

down:
	docker-compose down

clean: down
	
fclean: clean

PHONY: all up migrate down clean fclean