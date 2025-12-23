import { Effect, Fiber } from "effect"

const program = Effect.gen(function* () {
	const latch = yield* Effect.makeLatch(false)

	const makeRequest = Effect.sleep("200 millis").pipe(
		Effect.tap(console.log("request completed")),
		latch.whenOpen
	)
	// This is really just yielding latch.await
	// const makeRequest = Effect.gen(function* () {
	// 	yield* latch.await
	// 	yield* Effect.sleep("200 millis")
	// 	console.log("request completed")
	// })

	const fiber = yield* Effect.fork(makeRequest)

	yield* Effect.sleep("1 second")
	console.log("after sleep")
	// yield* latch.open
	// Release all fibers waiting on the latch
	yield* latch.release
	yield* Fiber.join(fiber)
})

Effect.runPromise(program)
