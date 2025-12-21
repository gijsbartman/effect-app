import { Console, Effect, Exit, Schedule, Scope } from "effect"

const backgroundHeartbeat = Effect.repeat(
	Console.log("Heartbeat"),
	Schedule.fixed("200 millis")
)

const program = Effect.gen(function* () {
	const scope = yield* Scope.make()

	yield* Console.log("starting")

	// We can use forkScoped which adds Scope as a requirement to the program
	yield* Effect.forkScoped(backgroundHeartbeat)
	// If you want to use your own scope
	yield* Effect.forkIn(backgroundHeartbeat, scope)

	yield* Effect.sleep("1 second")

	// Making sure to close your own scope
	yield* Scope.close(scope, Exit.void)
	yield* Console.log("Done")
}).pipe(Effect.scoped, Effect.runPromise)
