import { Console, Effect } from "effect"

declare const openReport: Effect.Effect<{
	readonly path: string
	readonly close: () => Promise<void>
}>

const program = Effect.gen(function* () {
	// acquireRelease -> When you want to keep using the resource across multiple steps inside a scope
	// const handle = yield* Effect.acquireRelease(openReport, (handle) =>
	// 	Effect.promise(() => handle.close())
	// )

	// What if you only want a single call, if you're going to consume it right away
	// acquireUseRelease -> When you only need the resource for one block of work
	yield* Effect.acquireUseRelease(
		openReport,
		(handle) => Console.log(`streaming ${handle.path}`),
		(handle) => Effect.promise(() => handle.close())
	)
})
