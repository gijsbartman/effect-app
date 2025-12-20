import { Schema, Struct } from "effect"

// If you want to check if the Number is not NaN
const NonNaNFromString = Schema.NumberFromString.pipe(
	// You can add a filter
	// Schema.nonNaN()
	// What if you want to use NonNaN which is another schema not a transformation
	// We can use Schema.compose
	Schema.compose(Schema.NonNaN), // <- Input must match output of parent schema

	Schema.asSchema
)

const InsertModel = Schema.Struct({
	name: Schema.optionalWith(Schema.String, {}),
	age: Schema.optionalWith(Schema.Number, {}),
})
type InsertModel = typeof InsertModel.Type

// If you want to make the name required
const OutputModel = Schema.Struct(
	// Spread the old schema
	// {...InsertModel.fields,
	// name: Schema.String,}

	// Partial transformation
	// Works for any objects you want, not restricted to schemas (see docs)
	Struct.evolve(InsertModel.fields, {
		name: (old) => Schema.String,
	})
).pipe(Schema.asSchema)

// Or you can use compose
const OuputModel = InsertModel.pipe(
	Schema.compose(
		// This approach stripped away age from decoded type
		// This makes sense because in TS you can pass
		// { readonly name: string, readonly age: number} into a function with only
		// (param: { readonly name: string })
		Schema.Struct({
			name: Schema.String,
		})

		// If you dont want to strip other fields you can use Struct.evolve like above
	),
	Schema.asSchema
)

// parseJson of course returns unknown
const x = Schema.parseJson().pipe(
	// But we can compose the schema
	Schema.compose(Schema.Struct({ name: Schema.String })),
	Schema.asSchema
)
// This works because
// unkown -> superset
// { readonly name: string } -> subset

// But parseJson is a function so we can write it simpler
const y = Schema.parseJson(Schema.Struct({ name: Schema.String })).pipe(
	Schema.asSchema
)
