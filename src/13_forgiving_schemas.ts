// NullOrFromFallible

import { Console, Effect, Either, ParseResult, Schema } from "effect"
import { constNull, identity } from "effect/Function"
import { isNotNull } from "effect/Predicate"

// a schema that allows null values and falls back to null on decoding errors
const NullOrFromFallible = <A, I, R>(
	self: Schema.Schema<A, I, R>,
	options?: { logPrefix?: string }
) =>
	Schema.NullOr(self).annotations({
		// Must return an either or an effect
		decodingFallback: (issue) =>
			// Either.right(null)
			// Meaning you can do async actions here and fetch a fallback for example
			// For logging TreeFormatter is better for backend
			Effect.logWarning(
				`[${
					options?.logPrefix ?? "NullOrFromFallible"
				}] ${ParseResult.TreeFormatter.formatIssueSync(issue)}`
			).pipe(
				// ArrayFormatter better for frontend so you can properly display the message
				// and it returns an array of issues
				Effect.tap(() =>
					Console.log(ParseResult.ArrayFormatter.formatIssueSync(issue))
				),

				// Effect.map(constNull)
				Effect.as(null)
			),
	})

const User = Schema.Struct({
	name: Schema.String,
	age: NullOrFromFallible(Schema.Number),
})

// const decode = Schema.decodeUnknown(User)
// decode({
// 	name: "Gijs",
// 	age: undefined,
// }).pipe(Effect.runPromise)

const ArrayFromFallible = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
	Schema.Array(
		NullOrFromFallible(schema, { logPrefix: "ArrayFromFallible" })
	).pipe(
		Schema.transform(Schema.typeSchema(Schema.Array(schema)), {
			decode: (array) => array.filter(isNotNull),
			encode: identity,
		})
	)

const decode2 = Schema.decodeUnknown(ArrayFromFallible(Schema.String))
decode2(["Hello", "world", 5]).pipe(Effect.tap(console.log), Effect.runPromise)
