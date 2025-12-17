import { Effect } from "effect"

type Thunk<A, E, R> = () => Effect.Effect<A, E, R>

const program = Effect.succeed("Hello, world!")
const program2 = Effect.fail(new Error("Failed to generate random number"))

const random = Effect.sync(() => Math.random())

const fetchUserPromise = () => fetch("https://api.github.com/users/octocat")
const fetchUser = Effect.promise(() => fetch("/api/user"))

try {
  const result = await Effect.runPromiseExit(fetchUser)
  if (result._tag === "Success") {
    console.log(result.value)
  } else {
    console.error(result.cause)
  }
} catch (error) {
  console.error(error)
}
