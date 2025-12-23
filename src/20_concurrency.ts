/**
 * Concurrency
 *
 * Lot of information idk what to do with
 * Custom implementation of an Effect.all that does trigger onInterrupt
 * https://lucasbarake.com/courses/practical-effect/43
 */

import { Array, Effect, identity, Random } from "effect"

const makeTask = (index: number) =>
	Effect.gen(function* () {
		const ms = yield* Random.nextRange(200, 400)
		yield* Effect.sleep(ms)
		console.log(`Task #${index} finished`)
	})

const program = Effect.gen(function* () {
	const tasks = Array.makeBy(10, (index) => makeTask(index))
	// This now runs all tasks after oneanother
	yield* Effect.all(tasks, {
		// But you can set the options.concurrency to unbounded so they all run at the same time
		// concurrency: "unbounded",
		// Or a number for the amoutn of slots where when one slot opens up the next one can start
		concurrency: 5,
	})
}).pipe(Effect.runPromise)

/**
 * More ways to do concurrency
 * https://lucasbarake.com/courses/practical-effect/44
 */
const program2 = Effect.gen(function* () {
	const tasks = Array.makeBy(10, (index) => makeTask(index))

	const [excluded, satisfying] = yield* Effect.partition(
		Array.makeBy(10, identity),
		(index) => makeTask(index),
		{
			concurrency: 5,
		}
	)
}).pipe(Effect.runPromise)
