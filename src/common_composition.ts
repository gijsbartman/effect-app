import { Array, Effect, Unify } from "effect"

/**
 * Succeed and error channel here are represented with a union
 * Probably wont come across this often because this is not a common pattern
 */
const divide = (a: number, b: number) => {
	if (b === 0) {
		return Effect.fail(new Error("Division by zero"))
	}
	return Effect.succeed(a / b)
}

/**
 * But can be fixed with Unify
 */
const divide2 = Unify.unify(divide)

/**
 * Or with Effect.suspend
 * useful for lazy evaluation and more (read docs)
 */
const divide3 = (a: number, b: number) =>
	Effect.suspend(() => {
		if (b === 0) {
			return Effect.fail(new Error("Division by zero"))
		}
		return Effect.succeed(a / b)
	})

const filterNonEmpty = <A>(values: Array<A>) =>
	Effect.suspend(() =>
		values.length > 0
			? Effect.succeed(values)
			: Effect.fail(new Error("Values array is empty"))
	)

const program = Effect.sync(() => ({
	id: "report-123",
	timestamp: new Date().toISOString(),
	// values: [10, 20, 30, 40, 50],
	// Or use Array.empty to create an empty array
	values: Array.empty<number>(),
})).pipe(
	Effect.map((data) => data.values),
	// flatMap is used otherwise the return channel will contain an Effect
	// Effect.flatMap((values) => filterNonEmpty(values))

	// Or use Effect.tap
	// tap is used to perform side effects without modifying the return channel
	//   Effect.tap((array) => {
	//     if (array.length === 0) {
	//       return Effect.fail(new Error("Values array is empty"))
	//     }
	//     return Effect.void
	//   })

	// Or more declarative way with Effect.filterOrFail
	Effect.filterOrFail(
		// (values) => values.length > 0,
		// Or use Effect's Array module
		Array.isNonEmptyArray,
		() => new Error("Values array is empty")
	),

	// Assignment: add values and devide by the length of the array
	Effect.flatMap((values) => {
		const sum = values.reduce((acc, value) => acc + value, 0)
		return divide3(sum, values.length)
	}),

	// What if you dont want to return an error but have a fallback
	// Error becomes a string
	//   Effect.catchAll((error) => Effect.fail(error.message)),
	// Or return a fallback value and will never fail
	//   Effect.catchAll((error) => Effect.succeed(0))

	// More idiomatic way to do this, this is for expected errors
	Effect.orElseSucceed(() => 0)
)

Effect.runPromise(program).then(console.log)
