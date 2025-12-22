import { Console, Context, Effect, Layer, Schema } from "effect"

const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
class User extends Schema.Class<User>("User")({
	id: UserId,
	name: Schema.String,
}) {}

// const UserRepositoryLive = {
// 	getUser(id: UserId) {
// 		return Effect.succeed(new User({ id, name: "Gijs" }))
// 	},
// }
// What if this is an effect
const UserRepositoryLive = Effect.gen(function* () {
	// This sleep will cause the entire program to slow because it needs to wait for requirements to be constructed
	// Makes sense because the might need to wait for a db connection
	yield* Effect.sleep("5 second")
	console.log("UserRepositoryLive")

	return {
		getUser(id: UserId) {
			return Effect.succeed(new User({ id, name: "Gijs" }))
		},
	}
})

class UserRepository extends Context.Tag("UserRepository")<
	UserRepository,
	// It is prefered to let typescript create implicit types instead of this
	// {
	// 	readonly getUser: (id: UserId) => Effect.Effect<User, never, never>
	// }

	// You can let typescript to the handling
	// typeof UserRepositoryLive
	// Now that its an effect you need this to extract the success channel of UserRepositoryLive
	Effect.Effect.Success<typeof UserRepositoryLive>
>() {
	// Convention is to expose a static property here for the live implementation
	static readonly Live = UserRepositoryLive
}

// A child program also requires UserRepository but no need to pass it too
const childProgram = Effect.gen(function* () {
	// This now requires UserRepository
	const userRepository = yield* UserRepository
	const user = yield* userRepository.getUser(UserId.make("2"))
	console.log(user)
})

const program = Effect.gen(function* () {
	yield* childProgram

	// This now requires UserRepository
	const userRepository = yield* UserRepository
	const user = yield* userRepository.getUser(UserId.make("1"))
	console.log(user)
}).pipe(
	// Providing it here successfully provided it to the program with provideService
	// Effect.provideService(UserRepository, {
	// 	getUser(id) {
	// 		return Effect.succeed(new User({ id, name: "Gijs" }))
	// 	},
	// })
	// But now that UserRepositoryLive is actually an effect you need provideServiceEffect
	Effect.provideServiceEffect(UserRepository, UserRepository.Live)
)

// Effect.runPromise(program)

/**
 * Services that depend on other services
 */
class Database extends Context.Tag("Database")<
	Database,
	{
		readonly execute: Effect.Effect<unknown, never, never>
	}
>() {
	// 5. So we should turn our Live implementation into a Layer
	static readonly Live = Layer.effect(
		this,
		Effect.gen(function* () {
			yield* Console.log("Database.Live created")
			return { execute: Effect.succeed(void 0) }
		})
	)
}

const UserRepositoryLive2 = Effect.gen(function* () {
	const database = yield* Database
	console.log("UserRepositoryLive2")

	return {
		getUser(id: string) {
			return Effect.succeed({ id, name: "Gijs" })
		},
	}
})
	.pipe
	// // 2. So we can provide the Database here locally
	// Effect.provideServiceEffect(Database, Database.Live)
	()

class UserRepository2 extends Context.Tag("UserRepository2")<
	UserRepository2,
	Effect.Effect.Success<typeof UserRepositoryLive2>
>() {
	static readonly Live = Layer.effect(this, UserRepositoryLive2).pipe(
		// 6. Then we can provide the database to the layer (not the effect)
		Layer.provide(Database.Live)
	)
}

// 3. But what happens when you add another repository that also requires Database
class TodoRepository extends Context.Tag("TodoRepository")<
	TodoRepository,
	{
		readonly getTodo: (id: string) => Effect.Effect<unknown, never, never>
	}
>() {
	static readonly Live = Layer.effect(
		this,
		Effect.gen(function* () {
			const database = yield* Database
			console.log("TodoRepositoryLive")

			return {
				getTodo(id: string) {
					return Effect.succeed({ id, title: "Todo 1" })
				},
			}
		})
	).pipe(
		// 4. Then we also provide the database here,
		// But now for every repository we are establishing a new Database connection
		// So the simplest solution would be to remove this from the repositories and move them to the root
		// But then we return back to our initial problem
		// Effect.provideServiceEffect(Database, Database.Live)

		// 8. If you want a fresh layer so it does run again you can use Layer.fresh
		Layer.provide(Layer.fresh(Database.Live))
	)
}

const program2 = Effect.gen(function* () {
	const todoRepository = yield* TodoRepository
	const todo = yield* todoRepository.getTodo("1")
	console.log(todo)

	const userRepository = yield* UserRepository2
	const user = yield* userRepository.getUser("2")
	console.log(user)
}).pipe(
	// 1. So what you can do it provide the database here
	// But in Effect the idea is to colocate everything, so you should provide services where they are immediatly needed
	// Otherwise if there are a lot of requirements this wont be maintainable to put them all here
	// Effect.provideServiceEffect(Database, Database.Live)

	// 7. using Effect.provideService doesn't work
	// Effect.provideServiceEffect(UserRepository2, UserRepository2.Live),
	// Effect.provideServiceEffect(TodoRepository, TodoRepository.Live)
	// We simply use Effect.provide
	// Which should take in an array if there are multiple
	// And now database.live is only created once
	Effect.provide([TodoRepository.Live, UserRepository2.Live])
	// Effect.provide(UserRepository2.Live)
)

Effect.runPromise(program2)

/**
 * Avoiding dependency leaks
 * & when not use a constructor (like with current user)
 * https://lucasbarake.com/courses/practical-effect/37
 * https://effect.website/docs/requirements-management/layers/#avoiding-requirement-leakage
 */

/**
 * Simplifying Services with Effect.Service
 * https://lucasbarake.com/courses/practical-effect/38
 * https://effect.website/docs/requirements-management/layers/#simplifying-service-definitions-with-effectservice
 */

/**
 * Optional services
 * https://lucasbarake.com/courses/practical-effect/39
 * https://effect.website/docs/requirements-management/services/#optional-services
 * https://effect-ts.github.io/effect/effect/Context.ts.html#reference
 */

/**
 * Scoped layers & ManagedRuntime
 * https://lucasbarake.com/courses/practical-effect/40
 * https://effect.website/docs/requirements-management/layers/#alternative-ways-to-define-a-service
 * https://effect.website/docs/runtime/#managedruntime
 */

/**
 * Accessors & Default Services
 * https://lucasbarake.com/courses/practical-effect/41
 *
 * Like calling a function of a service directly,
 * so you dont have to yield a database
 * ```
 * 	const database = yield* Database
 *  yield* database.execute()
 * ```
 * Instead you could just use database.execute
 *
 * Not recommended to use because if you're not careful it can easily cause dependency leaks
 */

/**
 * Mocking Services
 * https://lucasbarake.com/courses/practical-effect/42
 */

/**
 * Understanding MemoMap
 * https://lucasbarake.com/courses/practical-effect/58
 */
