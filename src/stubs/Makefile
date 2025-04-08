#!/usr/bin/make
.PHONY: help
.PHONY: start

DOCKER_COMPOSE=docker compose
DOCKER_EXEC_PHP=${DOCKER_COMPOSE} exec php-fpm
DOCKER_EXEC_NODE=${DOCKER_COMPOSE} exec node

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

#############
#### STACK
#############

install: build start ## Setup docker compose stack
	@echo "🔨 Setup Composer dependencies...
"
	$(DOCKER_EXEC_PHP) bash -c '\
		if [ -f .composer/auth.json ]; then \
			echo "Found auth.json, copying to /home/web/.config/composer/"; \
			mkdir -p /home/web/.config/composer; \
			cp .composer/auth.json /home/web/.config/composer/auth.json; \
		else \
			echo "auth.json not found, skipping copy."; \
		fi'
	@$(DOCKER_EXEC_PHP) composer install
	@$(DOCKER_EXEC_PHP) composer require filament/filament:"^3.3" -W
	@$(DOCKER_EXEC_PHP) composer require awcodes/filament-curator
	@$(DOCKER_EXEC_PHP) composer require webid/druid

	@echo "👻 Setup .env files and generate app keys"
	${DOCKER_EXEC_PHP} php artisan key:generate
	${DOCKER_EXEC_PHP} php artisan filament:install --panels --no-interaction
	${DOCKER_EXEC_PHP} php artisan curator:install --no-interaction
	sleep 1 #Avoid same second db migration prefix between curator and druid
	${DOCKER_EXEC_PHP} php artisan vendor:publish --provider="Webid\Druid\DruidServiceProvider"
	${DOCKER_EXEC_PHP} php artisan vendor:publish --tag="curator-config"

	${DOCKER_EXEC_PHP} php artisan storage:link

	$(MAKE) fresh

	${DOCKER_EXEC_NODE} npm i -D cropperjs
	${DOCKER_EXEC_NODE} npm run build
	@echo "🔨 Project setup done!"

install_debug_tools:
	@$(DOCKER_EXEC_PHP) composer require barryvdh/laravel-debugbar --dev
	@$(DOCKER_EXEC_PHP) composer require laravel/telescope
	${DOCKER_EXEC_PHP} php artisan telescope:install
	${DOCKER_EXEC_PHP} php artisan migrate

build: ## Build Docker stack
	@echo "🐳 Build or rebuild stack images..."
	@WWWUSER=$(shell id -u) WWWGROUP=$(shell id -g) docker compose build

destroy: ## Destroy Docker stack
	$(DOCKER_COMPOSE) --profile "*" down -v --remove-orphans
	@if [ "$(CI)" != "true" ]; then \
		read -p "Delete .env? (y/n): " confirm && \
		if [ "$$confirm" = "y" ]; then \
			rm -f .env; \
			echo ".env deleted."; \
		else \
			echo "Deletion aborted."; \
		fi; \
		read -p "Delete .env.testing? (y/n): " confirm && \
		if [ "$$confirm" = "y" ]; then \
			rm -f .env.testing; \
			echo ".env.testing deleted."; \
		else \
			echo "Deletion aborted."; \
		fi; \
	else \
		echo "CI mode detected: Skipping .env deletion prompts."; \
	fi

restart: stop start ## Restart stack

start: ## Start Docker stack
	@echo "🐳 Make sure docker stack is up..."
	@$(DOCKER_COMPOSE) up -d --wait

stop: ## Stop Docker stack
	${DOCKER_COMPOSE} stop

#############
#### DATABASE
#############

fresh: ## Refresh Docker DBs
	@echo "🗃️ Setup databases and run default seeding..."
	# delete storage files files
	$(DOCKER_EXEC_PHP) bash -c '\
		if [ -d storage/debugbar/ ]; then find storage/debugbar/ -type f -delete; fi; \
		if [ -d storage/app/private/ ]; then find storage/app/private/ -type f -delete; fi; \
		if [ -d storage/app/tmp/ ]; then find storage/app/tmp/ -type f -delete; fi'
	${DOCKER_EXEC_PHP} php artisan migrate:fresh --seed
	${DOCKER_EXEC_PHP} php artisan migrate:fresh --env=testing

seed_demo:
	${DOCKER_EXEC_PHP} php artisan druid:demo