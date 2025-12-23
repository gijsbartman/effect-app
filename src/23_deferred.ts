/**
 * A Deferred<A, E> is a one-shot synchronization cell: once any fiber completes it, the
 * same success or failure is permanently stored and every awaiting fiber observes that
 * outcome
 */

import { Array, Deferred, Effect, Random } from "effect"

const program = Effect.gen(function* () {
	const deferred = yield* Deferred.make<number, string>()

	const worker = (id: number) =>
		Effect.gen(function* () {
			console.log(`worker ${id}: waiting`)
			const result = yield* Deferred.await(deferred)
			console.log(`worker ${id}: released with ${result}`)
			yield* Effect.sleep("250 millis")
			console.log(`worker ${id}: done`)
		})

	const coordinator = Effect.gen(function* () {
		console.log("coordinator: preparing resources")
		yield* Effect.sleep("300 millis")
		console.log("coordinator: releasing workers")
		// yield* Deferred.succeed(deferred, yield* Random.nextRange(1, 100))
		return yield* Effect.dieMessage("death")
	}).pipe(Effect.onError((cause) => Deferred.failCause(deferred, cause)))

	const workers = Array.makeBy(10, (index) => worker(index))
	yield* Effect.all(Array.append(workers, coordinator), {
		concurrency: "unbounded",
	})
})

Effect.runPromise(program)
