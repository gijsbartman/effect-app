import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: ["./vitest.setup.ts"],
		include: ["test/**/*.test.ts", "src/**/*.test.ts"],
		fakeTimers: {
			toFake: undefined,
		},
		sequence: {
			concurrent: true,
		},
	},
})
