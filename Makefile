.PHONY: dev build test fix fix-all lint format sb

dev:
	yarn dev

iphone-dev:
	HTTPS=1 yarn dev --host

build:
	BUILD_VERSION="build at: $$(date '+%Y/%m/%d %H:%M:%S')" yarn build

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
