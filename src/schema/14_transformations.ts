import { Data, Effect, ParseResult, Schema } from "effect"

const ProductId = Schema.Trimmed.pipe(Schema.minLength(1))
const Product = Schema.Struct({
	id: ProductId,
	name: Schema.String,
	price: Schema.Number,
})

class ProductNotFoundError extends Data.TaggedError(
	"ProductNotFoundError"
)<{}> {}

const ProductRepository = {
	findById: (id: string) =>
		Effect.suspend(() =>
			id === "SKU-123"
				? Effect.succeed({ id, name: "Widget", price: 499 })
				: new ProductNotFoundError()
		),
}

const ProductFromId = Schema.transformOrFail(ProductId, Product, {
	strict: true,
	encode: (product) => Effect.succeed(product.id),
	decode: (id, _options, ast, rawId) =>
		ProductRepository.findById(id).pipe(
			Effect.mapError(
				() =>
					new ParseResult.Transformation(
						ast,
						rawId,
						"Encoded",
						new ParseResult.Type(ast.to, rawId, `No product with id ${rawId}`)
					)
			)
		),
})

const decode = Schema.decodeUnknown(ProductFromId)
decode("SKU-1234").pipe(Effect.tap(console.log), Effect.runPromise)
