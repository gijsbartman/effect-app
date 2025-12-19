import { Cause, Data, Effect, Exit, identity, Option } from "effect"

/**
 * Inspect causes after running an effect
 */
class CustomError extends Data.TaggedError("CustomError")<{
	code: string
	message: string
}> {}

const program = Effect.gen(function* () {
	// return yield* Effect.die(new TRPCError) <- This will throw a wrapper with Effect.runPromise
	return yield* new CustomError({
		code: "INTERNAL_SERVER_ERROR",
		message: "Custom error",
	})
})

// If you need to throw specific errors, like TRPCError (not recommended better create a tagged wrapper error),
// you cant use Effect.runPromise because this will throw a wrapper
// Use Effect.runPromiseExit instead so you get a typed Cause
const exit = await Effect.runPromiseExit(program)

/**
 * An option is T | null
 * If you want to operate on just the value you have to use ifs etc.
 * No need to handle conditionals
 * Option.Option<T>
 * None -> null | undefined
 * Some -> T
 * _tag: "None" | "Some"
 */
// This is Option<string>
const x = Option.fromNullable(null as string | null | undefined).pipe(
	Option.map((x) => x.toUpperCase()),
	Option.map((x) => x.length),

	// If you want an actual value, instead of x being Option<T>
	// Option.getOrElse(() => 0),
	// Option.getOrNull,
	// Option.getOrUndefined,
	// Option.getOrThrow
	Option.getOrThrowWith(() => new Error("No value"))
)

// Option also has a generator
const gen = Option.gen(function* () {
	const x = yield* Option.fromNullable(null as string | null | undefined)
	return x
})

// Guard yourself against any throw errors and represent that as a None
const opt = Option.liftThrowable(() => {
	let value = 5
	if (Math.random() > 0.5) {
		throw new Error("No value")
	}
	return value
})
// E.g. use it with JSON.parse
const parseJson = Option.liftThrowable(JSON.parse)
const y = parseJson('{"name": "John", "age": 30}')

if (exit._tag === "Failure") {
	// Gives you an Option<T>
	// const failureOption = Cause.failureOption(exit.cause)

	// // Check for failures
	// if (failureOption._tag === "Some") {
	// 	throw failureOption.value
	// }

	// // Check for defects
	// const defectOption = Cause.dieOption(exit.cause)
	// if (defectOption._tag === "Some") {
	// 	throw defectOption.value
	// }

	// // Check for interruptions
	// const interruptOption = Cause.interruptOption(exit.cause)
	// if (interruptOption._tag === "Some") {
	// 	throw interruptOption.value
	// }

	// If you do not want to go through the hassle of checking one by one you can use Cause.squash
	// Check docs for order
	const failureOption = Cause.squash(exit.cause)
}

// So then this can return an
const program2 = exit.pipe(
	Exit.match({
		// Identity function, returns the value it takes in
		// onSuccess: (value) => Option.some(value),
		onSuccess: identity,
		onFailure: (cause) => {
			throw Cause.squash(cause)
		},
	})
)
