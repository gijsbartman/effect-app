/**
 * A scope represents the lifetime of one or more resources
 */

import { Console, Effect, Exit, Scope } from "effect"

const program = Effect.gen(function* () {
	const scope = yield* Scope.make()

	yield* Scope.addFinalizer(scope, Console.log("Closing network connection"))
	yield* Scope.addFinalizer(scope, Console.log("Closing remote file"))

	// An error between the making and closing of a scope causes the finalizers to not run
	yield* Effect.dieMessage("Die")

	yield* Console.log("Done")
	yield* Scope.close(scope, Exit.void)
})

const scoped = <A, E, R>(self: Effect.Effect<A, E, R>) =>
	Effect.gen(function* () {
		const scope = yield* Scope.make()
		const extended = Scope.extend(self, scope)

		return yield* extended.pipe(
			Effect.onExit((exit) => Scope.close(scope, exit))
		)
	})

// You can instead use Effect.addFinalizer, but this now adds a requirement to this program
// Effect.Effect<void, never, Scope.Scope>
const program2 = Effect.gen(function* () {
	yield* Effect.addFinalizer(() => Console.log("Closing network connection"))
	yield* Effect.addFinalizer(() => Console.log("Closing remote file"))
}).pipe(
	// provides the requirement
	// scoped,
	// Effect has their own implementation for scoped because its common
	Effect.scoped,
	Effect.runPromise
)
