import { describe, expect, it } from "@effect/vitest"
import { Effect, TestClock } from "effect"
import { cacheSuccessSWR } from "./21_swr.js"

describe("cacheSuccessSWR", () => {
	it.scoped(
		"should execute on cache miss, return cached value on hit, and refresh stale in background",
		() =>
			Effect.gen(function* () {
				let count = 0
				const underlyingEffect = Effect.sync(() => ++count)
				const cachedEffect = yield* cacheSuccessSWR(
					underlyingEffect,
					"5 seconds"
				)

				// 1. Cache miss - executes underlying effect
				const res1 = yield* cachedEffect
				expect(res1).toBe(1)

				// 2. Cache not (not expired) - returns cached value
				const res2 = yield* cachedEffect
				expect(res2).toBe(1)
				expect(count).toBe(1)

				// 3. Cache expired - returns stale value immediatly, refreshes in background
				yield* TestClock.adjust("5 seconds")
				const res3 = yield* cachedEffect
				expect(res3).toBe(1)

				yield* Effect.yieldNow()

				const res4 = yield* cachedEffect
				expect(res4).toBe(2)
				expect(count).toBe(2)
			})
	)
})
