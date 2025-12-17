import { Data, Effect, Exit } from "effect"

// Expected errors -> Actionable errors
const program = Effect.try({
	try: () => {},
	catch: () => new Error("Failed"),
})

// Unexpected errors (defects) -> Unactionable errors
const program2 = Effect.sync(() => {
	throw new Error("Failed")
})

/**
 * Tagged errors
 * _tag: string
 * Cause<E>
 * Exit<A, E>, Option, Either, and later with Services
 */

class CustomError extends Data.TaggedError("CustomError")<{
	message: string
}> {}
// class CustomError extends Error {
// 	_tag = "CustomError" as const
// 	constructor(message: string) {
// 		super(message)
// 	}
// }

class RequestError extends Error {
	_tag = "RequestError" as const
	constructor(message: string) {
		super(message)
	}
}

class NetworkError extends Error {
	_tag = "NetworkError" as const
	constructor(message: string) {
		super(message)
	}
}

const program3 = (
	Effect.fail(new CustomError({ message: "Failed" })) as Effect.Effect<
		never,
		CustomError | RequestError | NetworkError
	>
).pipe(
	// Recovering from an error, removes it from the error channel
	// Effect.catchTag has overloads for multiple tags
	// Effect.catchTag("CustomError", "RequestError", (error) => Effect.void),
	// Or individually
	// Effect.catchTag("RequestError", (error) => Effect.void)

	// Or Effect.catchTags
	Effect.catchTags({
		// Having to return effects is very tedious so we create errors using Data.TaggedError
		CustomError: (error) => new CustomError({ message: "Failed" }),
		RequestError: (error) => Effect.void,
		NetworkError: (error) => Effect.fail(new Error("Network error")),
	})

	// Or use Effect.orElseSucceed if you want to recover from all errors
)

/**
 * Cause data type
 * If we use Effect.promise and a promise rejects, we will get an unexpected error
 * 
 * ```{
  _id: 'Exit',
  _tag: 'Failure',
  cause: {
    _id: 'Cause',
    _tag: 'Die', <-
    ```
 */
const program4 = Effect.promise(() =>
	Promise.reject(new RequestError("Unknown"))
).pipe(
	// Effect.sandbox gives Cause<E> in the error channel
	Effect.sandbox,
	Effect.catchTags({
		Die: (die) => Effect.die(die.defect),
	})
)

// If an error is not actionable, we can use Effect.die to convert it to a defect
// Catch one specific error and turn it into a defect
const program5 = Effect.fail(new RequestError("Unknown")).pipe(
	Effect.catchTag("RequestError", (error) =>
		// Effect.die(error)
		// Or use Effect.dieMessage to convert the error to a defect with a message
		Effect.dieMessage("Network request failed")
	),

	// Or use Effect.catchAll to catch all errors and turn them into defects
	Effect.catchAll((error) => Effect.die(error)),

	// Or shorthand
	Effect.orDie
)
// Effect<Data, CustomError, never>
// RequestError removed from signature, becomes a defect

const exit = await Effect.runPromiseExit(program5)
console.log(exit)

/**
 * Cause has several tags:

Die - Unexpected throws or Effect.die:
Effect.die(new Error("Unexpected!"))

Fail - Expected errors via Effect.fail or Data.TaggedError:
Effect.fail(new CustomError({ message: "..." }))

Interrupt - Fiber canceled (you'll learn about this soon):
Example: User cancels LLM generation in a chat app
Server listens for connection close, interrupts the fiber handling generation
Cause tracks the fiber ID and interruption metadata

Empty - Fibers interrupted with no failure info:
Happens when fibers interrupted but fiber IDs weren't preserved
Usually means the whole program interrupted without other failures
You'll see: "All fibers interrupted without errors"

Parallel - Multiple failures from concurrent work:
Similar to Promise.all executing multiple promises concurrently
When multiple Effects fail at the same time, Cause composes them as Parallel
You'll see this when you learn about concurrency

Sequential - Multiple failures in sequence:
Typically from finalizers failing one after another
Effect can have many finalizers attached (you'll learn about these)
They run in sequence, so failures compose sequentially

What You'll Actually Use
**In practice, you'll mostly care about:**

Fail - actionable errors
Die - defects (at boundaries when executing)
Interrupt - later, when working with fibers

Empty, Parallel, and Sequential exist but are less common. They're good to know about when you encounter them, but sandbox is mainly for exploration and debugging.
 */
