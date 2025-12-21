import { Effect, Exit } from "effect"

/**
 * Finalizers
 * Effect.onExit
 * Effect.onError
 * Effect.onInterrupt
 * Effect.ensuring
 */

const program = Effect.gen(function* () {
	return yield* Effect.fail("Die")
}).pipe(
	// Effect.ensuring will run regardless of the outcome
	Effect.ensuring(Effect.log("Done")),
	Effect.onExit(
		Exit.match({
			onSuccess: (value) => Effect.log(value),
			onFailure: (cause) => Effect.log(cause),
		})
	),
	Effect.onError((_cause) => Effect.log("Died")),
	Effect.runPromise
)
