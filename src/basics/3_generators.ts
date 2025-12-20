import { Array, Effect } from "effect"
import { divide3 } from "./2_common_composition.js"

/**
 * From previous lecture
 */
const getReport = Effect.sync(() => ({
	id: "report-123",
	timestamp: new Date().toISOString(),
	values: [10, 20, 30, 40, 50],
}))

/**
 * Nesting can become a problem
 */
const fetchMultiplier = (average: number) => Effect.succeed(2) // imagine this fetches from API

const persist = (id: string, average: number, adjusted: number) => Effect.void // imagine this writes to DB

const result = getReport.pipe(
	Effect.map((data) => data.values),
	Effect.filterOrFail(Array.isNonEmptyArray, () => new Error("Empty array")),
	Effect.flatMap((values) => {
		const sum = values.reduce((a, b) => a + b, 0)
		const average = sum / values.length

		// Need average for both calls, but flatMap replaces the success channel
		return fetchMultiplier(average).pipe(
			Effect.flatMap((multiplier) =>
				persist("123", average, average * multiplier)
			),
			// Lost the average! Need to preserve it somehow
			Effect.as(average) // or use Effect.tap
		)
	})
)

/**
 * Effect has a way to write programs in a more declarative way with generators
 */
const gen = Effect.gen(function* () {
	// Unwraps the Effect and gives you the success value
	// Errors and requirements propagate to the parent Effect
	const report = yield* getReport

	// Instead of
	// if (Array.isEmptyArray(report.values)) throw new Error ("Empty array")
	// We do this because no error type safety and it will cause a defect (unexpected error)
	if (Array.isEmptyArray(report.values))
		return yield* Effect.fail(new Error("Empty array"))

	const sum = report.values.reduce((a, b) => a + b, 0)
	const avg = yield* divide3(sum, report.values.length)

	// const multiplier = yield* fetchMultiplier(avg)
	// Because multiplier is not used anywhere else we can also use pipe

	yield* fetchMultiplier(avg).pipe(
		Effect.tap((multiplier) => persist(report.id, avg, avg * multiplier))
	)

	return avg
}).pipe(Effect.orElseSucceed(() => 0))

Effect.runPromise(gen).then(console.log)
