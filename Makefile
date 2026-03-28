.PHONY: dev build test fix fix-all lint format

dev:
	yarn dev

build:
	yarn build

test:
	yarn test

lint:
	yarn eslint . --fix

format:
	yarn prettier --write 'src/**/*.{ts,tsx,css}'

fix: lint format test

fix-all: fix build
