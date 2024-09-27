all: up

up:
	docker-compose up -d

build:
	docker compose up -d --build

migrate:
	python3 manage.py migrate

down:
	docker-compose down

clean: down
	docker rmi -f $$(docker images -q)
	
fclean: down
	docker system prune -a -f
	docker rmi -f $$(docker images -q)

PHONY: all up build migrate down clean fclean