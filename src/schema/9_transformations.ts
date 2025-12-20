import { Schema } from "effect"

/**
 * Transformations
 * string -> number
 * number -> string
 */

const NumberFromString = Schema.transform(Schema.String, Schema.Number, {
	strict: true,
	decode: (string) => Number(string),
	encode: (number) => number.toString(),
}).pipe(
	// Use asSchema to improve the type
	// Schema.Schema<number, string, never>
	Schema.asSchema
)

type Decoded = typeof NumberFromString.Type
type Encoded = typeof NumberFromString.Encoded

const decode = Schema.decodeSync(NumberFromString) // <- Schema has Schema.NumberFromString & more
const encode = Schema.encodeSync(NumberFromString)

const decoded = decode("123")
// console.log(decoded)
const encoded = encode(decoded)
// console.log(encoded)

/** Assignment:
 *  Create booleanish transform
 */
const Booleanish = Schema.transform(
	Schema.Literal("yes", "no", 0, 1),
	Schema.Boolean,
	{
		strict: true,
		decode: (string) => string === "yes" || string === 1,
		encode: (boolean) => (boolean ? "yes" : "no"),
	}
).pipe(Schema.asSchema)

const decode2 = Schema.decodeSync(Booleanish)
const encode2 = Schema.encodeSync(Booleanish)

const decoded2 = decode2(0)
console.log(decoded2)
const encoded2 = encode2(decoded2)
console.log(encoded2)
