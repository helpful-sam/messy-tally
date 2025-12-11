.PHONY: dev build lint type test

dev:
	npm run tauri dev

build:
	npm run tauri build

lint:
	npm exec eslint .

type:
	npx tsc --noEmit

test:
	npm exec vitest run
