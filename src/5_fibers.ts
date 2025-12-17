import { Console, Data, Effect, Fiber } from "effect"
import { setTimeout } from "node:timers/promises"

const hello = Effect.gen(function* () {
	yield* Effect.log("Main fiber")
	// yield* Effect.sleep("2 seconds")
	// Make this non-blocking
	// But this doesn't work because this child fiber is tied to the lifetime of the parent fiber
	// And it also wont run without the sleep if this is the last yield before the return
	// because this child fiber doesn't get run immediately
	// yield* Effect.fork(
	// 	Effect.sleep("2 seconds").pipe(Effect.tap(() => Effect.log("After sleep")))
	// )
	yield* Effect.fork(Effect.log("Forked fiber"))

	// yield* Effect.log("Not waiting for the forked fiber")

	// So we can add another sleep to wait for the child fiber to complete
	// yield* Effect.sleep("3 seconds")

	// The fork will only run if it's succeeded by an Effect that suspends like
	// yield* Effect.sleep("5 millis")
	// yield* Effect.delay(Effect.log("After delay"), "2 seconds")
	yield* Effect.yieldNow()

	// A Console.log will not suspend, so the fork will not run
	// yield* Effect.log("Not waiting for the forked fiber")

	return "hello"
})

class CustomError extends Data.TaggedError("CustomError")<{
	message: string
}> {}

const slow = Effect.gen(function* () {
	yield* Effect.sleep("2 seconds")
	yield* new CustomError()
	// Everything after the error won't run in the parent fiber (makes sense)
	yield* Effect.log("Slow fiber")
	return 50
})

const hello2 = Effect.gen(function* () {
	yield* Effect.log("Before fork")
	const fiber = yield* Effect.fork(slow)

	// Fiber.join will make errors propagate naturally, child failures should automatically fail the parent
	// yield* Fiber.join(fiber)
	// Or use Fiber.await and handle the error manually, child failures shouldn't automatically fail the parent
	// yield* Fiber.await(fiber)
	// yield* fiber.await
	yield* Effect.log("After fork")
})

/**
 * Interrupting
 */
const interruptSlow = Effect.gen(function* () {
	yield* Effect.sleep("2 seconds")
	yield* new CustomError()
	yield* Effect.log("Slow fiber")
	return 50
}).pipe(
	// If the fiber is interrupted, the onInterrupt handler will run
	// Can be used as a finalizer
	Effect.onInterrupt(() => Console.log("Interrupted"))
)

const hello3 = Effect.gen(function* () {
	yield* Effect.log("Before fork")
	const fiber = yield* Effect.fork(interruptSlow)
	yield* Effect.yieldNow()
	// We can interrupt the fiber
	const exit = yield* Fiber.interrupt(fiber)
	console.log(exit)
	yield* Effect.log("After fork")
})

// await Effect.runPromise(hello3)

const repeat = Effect.log("hello").pipe(
	Effect.delay("300 millis"),
	Effect.repeat({ times: 20 })
)

const program = Effect.gen(function* () {
	yield* Effect.fork(repeat)
	// You can use Effect.forkDaemon to run a fiber independently of its parent
	// Shouldn't really use this
	// yield* Effect.forkDaemon(repeat)

	return yield* Effect.never
	// Runs indefinitely (like while(true))
	// Only stops when interrupted
}).pipe(Effect.onInterrupt(() => Console.log("interrupted")))

// Effect.runCallback returns a cancel function
const cancel = Effect.runCallback(program)

// Later, from anywhere:
await setTimeout(2000)
cancel() // Interrupts the program

/**
 * Perfect for cleanup in React hooks:
 * useEffect(() => {
  const cancel = Effect.runCallback(myProgram)
  return cancel // Cleanup function
}, [])
 */
