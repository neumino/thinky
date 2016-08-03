## Expected Behavior

## Actual Behavior

## Stack Trace
(the stack output from the Error if applicable, please wrap it in backticks for readability)

example:
```
> throw Error("i am a teapot")
Error: i am a teapot
    at Error (native)
    at repl:1:7
    at REPLServer.defaultEval (repl.js:272:27)
    at bound (domain.js:280:14)
    at REPLServer.runBound [as eval] (domain.js:293:12)
    at REPLServer.<anonymous> (repl.js:441:10)
    at emitOne (events.js:101:20)
    at REPLServer.emit (events.js:188:7)
    at REPLServer.Interface._onLine (readline.js:219:10)
    at REPLServer.Interface._line (readline.js:561:8)
```

## Code to Reproduce
(please link to a gist, a repo, or insert a snippet that clearly illustrates your minimum reproducable test case)

## Specifications
(The version of RethinkDB & thinky)