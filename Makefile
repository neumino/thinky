REPORTER ?= spec
TESTS = $(shell find ./test/* -name "*.js")
NPM_BIN = ./node_modules/.bin

jshint:
	$(NPM_BIN)/jshint lib

fixjsstyle:
	fixjsstyle -r lib --strict --jslint_error=all

coverage:
	$(NPM_BIN)/istanbul cover $(NPM_BIN)/_mocha --report lcovonly -- -t 10000 --ui tdd $(TESTS); \

test:
	@if [ "$$GREP" ]; then \
		make jshint && $(NPM_BIN)/mocha --globals setImmediate,clearImmediate --check-leaks --colors -t 10000 --reporter $(REPORTER) -g "$$GREP" $(TESTS); \
	else \
		make jshint && $(NPM_BIN)/mocha --globals setImmediate,clearImmediate --check-leaks --colors -t 10000 --reporter $(REPORTER) $(TESTS); \
	fi

.PHONY: jshint fixjsstyle coverage test
