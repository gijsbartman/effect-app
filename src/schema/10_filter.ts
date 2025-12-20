import { identity, Schema } from "effect"

const FormSchema = Schema.Struct({
	title: Schema.Trim.pipe(
		// <- Schema.Trim
		// Because Schema works with a Codec you have to do it like this
		// Schema.transform(Schema.String, {
		// 	strict: true,
		// 	decode: (string) => string.trim(),
		// 	encode: identity,
		// }),
		// However Effect has a lot of common transformations like Schema.Trim (see top)
		Schema.minLength(3),
		Schema.maxLength(100)
	),
}).pipe(Schema.asSchema)

const decode = Schema.decodeSync(FormSchema)
const encode = Schema.encodeSync(FormSchema)

const decoded = decode({ title: "    Gijs    " })
// console.log(decoded)
// This will throw because encode doesn't do the transformation (of trimming)
// const encoded = encode({ title: "    Gijs    " })
// console.log(encoded)

// Custom filters
const PasswordSchema = Schema.Struct({
	password: Schema.String,
	confirmPassword: Schema.String,
}).pipe(
	// Schema.filter((input) => input.password === input.confirmPassword, {
	// 	message: () => "Passwords should match",
	// })
	// We can apply the message to a specific field
	Schema.filter((input) => {
		if (input.password === input.confirmPassword) return true
		return {
			message: "Passwords should match",
			path: ["conformPassword"],
		}
	})
)
const decode2 = Schema.decodeSync(PasswordSchema)
const encode2 = Schema.encodeSync(PasswordSchema)

const decoded2 = decode2({ password: "123", confirmPassword: "123" })
console.log(decoded2)
const encoded2 = encode2({ password: "123", confirmPassword: "12" })
console.log(encoded2)
