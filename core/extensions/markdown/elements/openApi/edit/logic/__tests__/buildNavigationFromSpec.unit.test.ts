import buildNavigationFromSpec from "../buildNavigationFromSpec";

const response = { 200: { description: "OK" } };

describe("buildNavigationFromSpec", () => {
	test("uses the tag order declared by the specification", () => {
		const spec = {
			tags: [{ name: "users" }, { name: "auth" }],
			paths: {
				"/auth": { post: { tags: ["auth"], operationId: "signIn", responses: response } },
				"/users": { get: { tags: ["users"], operationId: "getUsers", responses: response } },
			},
		};

		expect(buildNavigationFromSpec(spec).map((tag) => tag.title)).toEqual(["users", "auth"]);
	});

	test("uses x-tagGroups before the root tag order", () => {
		const spec = {
			tags: [{ name: "other" }, { name: "auth" }, { name: "users" }],
			"x-tagGroups": [{ name: "Public", tags: ["users", "auth"] }],
			paths: {
				"/other": { get: { tags: ["other"], operationId: "other", responses: response } },
				"/auth": { post: { tags: ["auth"], operationId: "signIn", responses: response } },
				"/users": { get: { tags: ["users"], operationId: "getUsers", responses: response } },
			},
		};

		expect(buildNavigationFromSpec(spec).map((tag) => tag.title)).toEqual(["users", "auth", "other"]);
	});

	test("keeps operation document order", () => {
		const spec = {
			paths: {
				"/users": {
					post: { summary: "Create user", tags: ["users"], operationId: "createUser", responses: response },
					get: { summary: "Get users", tags: ["users"], operationId: "getUsers", responses: response },
				},
			},
		};

		expect(buildNavigationFromSpec(spec)[0].items.map((operation) => operation.title)).toEqual([
			"Create user",
			"Get users",
		]);
	});

	test("uses anchors rendered by the OpenAPI elements", () => {
		const navigation = buildNavigationFromSpec({
			paths: {
				"/users": {
					get: { summary: "Get users", tags: ["Пользователи"], operationId: "getUsers", responses: response },
				},
			},
		});

		expect(navigation[0].url).toBe("#tag-пользователи");
		expect(navigation[0].items[0].url).toBe("#operation-getusers");
	});

	test("uses operationId and then path when summary is missing", () => {
		const navigation = buildNavigationFromSpec({
			paths: {
				"/with-id": { get: { tags: ["users"], operationId: "getUsers", responses: response } },
				"/without-id": { get: { tags: ["users"], responses: response } },
			},
		});

		expect(navigation[0].items.map((operation) => operation.title)).toEqual(["getUsers", "/without-id"]);
		expect(navigation[0].items[1].url).toBe("#operation-get-without-id");
	});

	test("uses the localized untagged group", () => {
		const navigation = buildNavigationFromSpec({
			paths: {
				"/health": { get: { summary: "Health check", operationId: "healthCheck", responses: response } },
			},
		});

		expect(navigation[0].title).toBeTruthy();
		expect(navigation[0].items[0].title).toBe("Health check");
	});

	test("skips operations the renderer does not show", () => {
		const spec = {
			paths: {
				"/test": {
					connect: { summary: "Unsupported method", operationId: "connectTest", responses: response },
					get: { summary: "Missing responses", operationId: "getTest" },
				},
			},
		};

		expect(buildNavigationFromSpec(spec)).toEqual([]);
	});

	test("appends undeclared tags in first appearance order", () => {
		const spec = {
			tags: [{ name: "existing" }],
			paths: {
				"/second": { get: { tags: ["second"], operationId: "second", responses: response } },
				"/first": { get: { tags: ["first"], operationId: "first", responses: response } },
				"/existing": { get: { tags: ["existing"], operationId: "existing", responses: response } },
			},
		};

		expect(buildNavigationFromSpec(spec).map((tag) => tag.title)).toEqual(["existing", "second", "first"]);
	});
});
