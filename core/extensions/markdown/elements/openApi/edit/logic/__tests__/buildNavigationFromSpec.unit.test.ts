import buildNavigationFromSpec from "../buildNavigationFromSpec";

describe("buildNavigationFromSpec", () => {
	test("creates navigation from tags defined in spec", () => {
		const spec = {
			tags: [{ name: "users" }, { name: "auth" }],
			paths: {},
		};

		const result = buildNavigationFromSpec(spec);

		expect(result.map((t) => t.name)).toEqual(["users", "auth"]);
		expect(result[0]).toEqual(
			expect.objectContaining({
				name: "users",
				child: [],
			}),
		);
	});

	test("adds operations under correct tag", () => {
		const spec = {
			tags: [{ name: "users" }],
			paths: {
				"/users": {
					get: {
						summary: "Get users",
						tags: ["users"],
						operationId: "getUsers",
					},
				},
			},
		};

		const result = buildNavigationFromSpec(spec);

		const users = result.find((t) => t.name === "users");

		expect(users?.child.length).toBe(1);
		expect(users?.child[0].title).toBe("Get users");
		expect(users?.child[0].id).toEqual(expect.any(String));
	});

	test("uses path as title when summary is missing", () => {
		const spec = {
			tags: [{ name: "users" }],
			paths: {
				"/users": {
					get: {
						tags: ["users"],
						operationId: "getUsers",
					},
				},
			},
		};

		const result = buildNavigationFromSpec(spec);

		const users = result.find((t) => t.name === "users");
		expect(users?.child[0].title).toBe("/users");
	});

	test("falls back to default tag when operation has no tags", () => {
		const spec = {
			paths: {
				"/health": {
					get: {
						summary: "Health check",
						operationId: "healthCheck",
					},
				},
			},
		};

		const result = buildNavigationFromSpec(spec);

		const defaultTag = result.find((t) => t.name === "default");

		expect(defaultTag).toBeDefined();
		expect(defaultTag?.child[0].title).toBe("Health check");
	});

	test("skips invalid HTTP methods", () => {
		const spec = {
			paths: {
				"/test": {
					connect: {
						summary: "Should be ignored",
						operationId: "connectTest",
					},
				},
			},
		};

		const result = buildNavigationFromSpec(spec);

		expect(result.length).toBe(0);
	});

	test("creates new tag if tag is not defined in spec.tags", () => {
		const spec = {
			tags: [{ name: "existing" }],
			paths: {
				"/new": {
					get: {
						summary: "New endpoint",
						tags: ["dynamic"],
						operationId: "newOp",
					},
				},
			},
		};

		const result = buildNavigationFromSpec(spec);

		const dynamic = result.find((t) => t.name === "dynamic");
		expect(dynamic).toBeDefined();
		expect(dynamic?.child[0].title).toBe("New endpoint");
	});
});
