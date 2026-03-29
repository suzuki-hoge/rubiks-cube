.PHONY: dev build test fix fix-all lint format sb

dev:
	yarn dev

build:
	yarn build

test:
	yarn test

lint:
	yarn eslint . --fix --max-warnings 0

format:
	yarn prettier --write 'src/**/*.{ts,tsx,css}'

fix: lint format test

fix-all: fix build
	yarn build-storybook

sb:
	yarn storybook
