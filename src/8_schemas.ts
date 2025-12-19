/**
 * Effect Schemas
 * Like zod etc.
 * Schema is special because of its bidirectional nature
 * You define a Codec
 * I -> A (decoding)
 * A -> I (encoding)
 *
 * JSON -> User
 * User -> JSON
 *
 * E.g.
 * API -> User Object
 * localStorage -> JSON User Object
 * But a Date isn't serializable so you need to convert it to a string
 * Date -> string
 * Or Map -> Record<K, V>
 *
 * Schema.Map does this for you
 * Removing the need for superjson
 */

import { Effect, Schema, Either } from "effect"

// Define schema I
const User = Schema.Struct({
	name: Schema.String,
	age: Schema.Number,
})

// Validate data
const decode = Schema.decode(User)
// Or with unknown data
const decodeUnknown = Schema.decodeUnknown(User)
// Or if you don't want to run an effect you can use decodeSync like z.parse
// const decodeSync = Schema.decodeSync(User)

// Or if you dont want to throw errors and prefer results like a simplified effect that doesnt require its runtime
// Like neverthrow
const decodeEither = Schema.decodeEither(User)
// Which returns an either
// Either has left and right switched around in type def to preserve the order of an effect, success first then failure
// Either<A, E = never> = Left<E, A> | Right<E, A>
const either = decodeEither({ name: 2, age: 21 })
// Either can be treated like an Effect
// const programEither = decodeEither(...).pipe(...)
// But more relevant here be called straight up
if (either._tag === "Left") {
	either.left
} else {
	// y._tag === "Right"
	either.right
}
// console.log(either)

// Input is typed unlike zod ( z.parse(i: unknown): User or it will throw )
// As unknown gives a type error
const y = decode(5 as unknown)

const program = y.pipe(
	Effect.catchTag("ParseError", (error) => Effect.succeed(error.message))
)

const data = await Effect.runPromise(program)
// console.log(data)

// Unions & optional
const User2 = Schema.Struct({
	// name: Schema.Union(Schema.String, Schema.Null, Schema.Number),
	// name: Schema.NullOr(Schema.String),
	// name: Schema.UndefinedOr(Schema.String),
	name: Schema.NullishOr(Schema.String),

	// age: Schema.optional(Schema.String),
	// Or as an option which returns an Option in the decoded type
	age: Schema.optionalWith(Schema.Number, {
		as: "Option",
		// Add nullability
		nullable: true,
	}),
})
const x = Schema.decodeSync(User2)
// Age being Option<string>
type DecodedUser = typeof User2.Type // (output)
// type DecodedUser = Schema.Schema.Type<typeof User>
type EnodedUser = typeof User2.Encoded // (input)
// type DecodedUser = Schema.Schema.Encoded<typeof User>

// Bidirectional nature, you can also encode back
const decodeSync = Schema.decodeSync(User2)
const encodeSync = Schema.encodeSync(User2)

const decodedUser = decodeSync({ name: "Gijs", age: 21 })
console.log("DecodedUser", decodedUser)
const encodedUser = encodeSync(decodedUser)
console.log("EncodedUser", encodedUser)
