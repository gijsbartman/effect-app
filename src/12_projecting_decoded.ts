import { Schema } from "effect"

const Todo = Schema.Struct({
	title: Schema.String,
	completed: Schema.Boolean,
	// 2 problems, it uses snake case, convention is using camelCase
	// And DateFromString
	created_at: Schema.DateFromString,
}).pipe(
	Schema.rename({
		created_at: "createdAt",
	}),
	Schema.asSchema
)

const ApiResponse = Schema.Struct({
	items: Schema.Array(Todo),
}).pipe(
	// Schema.transform(
	// 	Schema.typeSchema(
	// 		// This causes a type error so we have to use Schema.typeSchema
	// 		// Which is kind of like identity for a schema
	// 		Schema.Array(Todo)
	// 	),
	// 	{
	// 		strict: true,
	// 		decode: (fromA) => fromA.items,
	// 		encode: (toI) => ({ items: toI }),
	// 	}
	// ),

	// Or shorthand
	Schema.pluck("items"),
	Schema.asSchema
)
