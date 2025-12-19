import { Data, Duration, Effect, Schedule } from "effect"

class RequestError extends Data.TaggedError("RequestError")<{
	cause: unknown
}> {}

class ResponseError extends Data.TaggedError("ResponseError")<{
	status: number
}> {}

const effectfulFetch = (url: string) =>
	Effect.tryPromise({
		try: () => fetch(url),
		catch: (error) => new RequestError({ cause: error }),
	}).pipe(
		Effect.filterOrFail(
			(response) => response.ok,
			(response) => new ResponseError({ status: response.status })
		)
		// Effect.flatMap((response) =>
		// 	response.ok
		// 		? Effect.succeed(response)
		// 		: Effect.die(new ResponseError({ status: response.status }))
		// )
	)

// Turn into a generator with Effect.fn
const effectfulFetchGen = Effect.fn(function* (url: string) {
	const response = yield* Effect.tryPromise({
		try: () => fetch(url),
		catch: (error) => new RequestError({ cause: error }),
	})

	if (!response.ok) {
		return yield* new ResponseError({ status: response.status })
	}

	return response
})

const program = Effect.gen(function* () {
	const response = yield* effectfulFetchGen("https://lensym.com")
	const json: unknown = yield* Effect.tryPromise({
		try: () => response.json(),
		catch: (error) => new RequestError({ cause: error }),
	})
	return json
}).pipe(
	Effect.timeout("5 seconds"),
	Effect.retry({
		times: 3,
		while: (error) =>
			error._tag === "RequestError" ||
			(error._tag === "ResponseError" && error.status === 500) ||
			error._tag === "TimeoutException",
		schedule: Schedule.exponential("500 millis", 2),
	}),
	Effect.orDie
)

Effect.runPromise(program).then(console.log)
