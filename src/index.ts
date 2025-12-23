import { Array, Clock, Duration, Effect, Option, Random, Scope } from "effect"

/**
 * cacheSuccessSWR
 * Returns an effect that caches its **successful** result with stale-while-revalidate behavior.
 *
 * This function provides cache-aside pattern with stale-while-revalidate strategy:
 * - On cache miss: blocks and waits for the effect to complete, then caches the result
 * - On cache hit (within TTL): returns cached value immediately
 * - On cache hit (expired): returns stale value immediately and triggers background refresh
 */
// cacheSuccessSWR(effectToCache, "1 minute"): Effect.Effect<Effect.Effect<A, E, R›, never, Scope.Scope>

const cacheSuccessSWR = <A, E, R>(
	self: Effect.Effect<A, E, R>,
	ttl: Duration.DurationInput
): Effect.Effect<Effect.Effect<A, E, R>, never, Scope.Scope> =>
	Effect.gen(function* () {
		const scope = yield* Scope.Scope

		let cache = Option.none<[expiry: number, value: A]>()
		const sem = yield* Effect.makeSemaphore(1)

		const get = Effect.gen(function* () {
			if (Option.isSome(cache)) {
				const now = yield* Clock.currentTimeMillis
				const [expiry, value] = cache.value
				if (now < expiry) return value
			}

			const result = yield* self
			const completedAt = yield* Clock.currentTimeMillis
			cache = Option.some([completedAt + Duration.toMillis(ttl), result])
			return result
		}).pipe(sem.withPermits(1))

		return Effect.gen(function* () {
			switch (cache._tag) {
				case "None": {
					return yield* get
				}
				case "Some": {
					const [expiry, value] = cache.value
					const now = yield* Clock.currentTimeMillis
					if (now < expiry) {
						return value
					}

					yield* Effect.forkIn(get, scope)

					return value
				}
			}
		})
	})

const program = Effect.gen(function* () {
	const effectWithCache = yield* cacheSuccessSWR(
		Random.nextRange(0, 1),
		"1 seconds"
	)

	const results = yield* Effect.all(
		Array.makeBy(10, () => effectWithCache),
		{
			concurrency: "unbounded",
		}
	)

	console.log(results)
	yield* Effect.sleep("2 seconds")

	const sameOneAsBefore = yield* effectWithCache
	console.log({ sameOneAsBefore })
	yield* Effect.all(
		Array.makeBy(10, () => effectWithCache),
		{ concurrency: "unbounded" }
	).pipe(Effect.tap(console.log))
}).pipe(Effect.scoped, Effect.runPromise)
