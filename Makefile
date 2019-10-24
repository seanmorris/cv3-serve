.PHONY: build test clean reconfigure

build: source/*.js
	npm run build

test:
	@ npm run build-test \
	&& node test.js

install:
	@ npm install -s

update:
	@ npm update -s

clean:
	@ rm -rf node_modules *.js
