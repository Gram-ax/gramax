import {
	ResourceEmptyError,
	ResourceLoadError,
	ResourceNotFoundError,
} from "@core-ui/ContextServices/ResourceService/errors";
import sendBug from "@ext/bugsnag/logic/sendBug";
import {
	classifyResourceError,
	parseOpenApiText,
	presentOpenApiError,
	reportOpenApiRenderError,
	validateOpenApiSpec,
} from "@ext/markdown/elements/openApi/render/openApiErrors";

jest.mock("@ext/bugsnag/logic/sendBug", () => jest.fn());

describe("OpenAPI error classification (U1-U3)", () => {
	test("a zero-byte file is reported as empty (U1), not as a wrong path", () => {
		// The resource layer never hands an empty file to the parser: it fails the load with
		// ResourceEmptyError and no buffer, so only this branch can tell the two U1 cases apart.
		const error = classifyResourceError(new ResourceEmptyError("./api.yaml"), undefined, "./api.yaml");
		expect(error).toEqual({ kind: "empty", path: "./api.yaml" });
	});

	test("a path that resolves to nothing is reported as missing (U1)", () => {
		expect(classifyResourceError(new ResourceNotFoundError("./api.yaml"), undefined, "./api.yaml")).toEqual({
			kind: "missing",
			path: "./api.yaml",
		});
		expect(classifyResourceError(new ResourceLoadError("./api.yaml"), undefined, "./api.yaml")).toEqual({
			kind: "missing",
			path: "./api.yaml",
		});
		expect(classifyResourceError(undefined, undefined, "./api.yaml")).toEqual({
			kind: "missing",
			path: "./api.yaml",
		});
	});

	test("a loaded buffer is not a user error at all", () => {
		expect(classifyResourceError(undefined, Buffer.from("openapi: '3.0.0'"), "./api.yaml")).toBeUndefined();
	});

	test("blank text is an empty file (U1), not a syntax error", () => {
		expect(parseOpenApiText("   \n", "./api.yaml").error).toEqual({ kind: "empty", path: "./api.yaml" });
	});

	test("valid YAML scalar that is not an object passes through for structure validation (U3)", () => {
		const result = parseOpenApiText("hello", "./api.yaml");
		expect(result.error).toBeUndefined();
		expect(result.spec).toBe("hello");
	});

	test("broken indentation is a syntax error (U2) with a 1-indexed line and column", () => {
		const result = parseOpenApiText("openapi: '3.0.0'\ninfo:\n  title: x\n bad:\n  - broken: [", "./api.yaml");
		expect(result.error?.kind).toBe("syntax");
		if (result.error?.kind !== "syntax") return;
		expect(result.error.format).toBe("YAML");
		expect(result.error.line).toBeGreaterThan(0);
		expect(result.error.column).toBeGreaterThan(0);
		expect(result.error.details.length).toBeGreaterThan(0);
	});

	test("invalid JSON is identified as JSON and reports its exact position", () => {
		const result = parseOpenApiText('{\n  "openapi": "3.0.4"\n  "paths": {}\n}', "./api.json");
		expect(result.error?.kind).toBe("syntax");
		if (result.error?.kind !== "syntax") return;
		expect(result.error.format).toBe("JSON");
		expect(result.error.line).toBe(3);
		expect(result.error.column).toBeGreaterThan(0);
		expect(result.error.details).toMatch(/JSON|position/i);
	});

	test("non-object input classifies as structure-object", () => {
		expect(validateOpenApiSpec("hello", "./api.yaml")?.kind).toBe("structure-object");
	});

	test("missing paths classifies as structure-paths", () => {
		expect(validateOpenApiSpec({ openapi: "3.0.0", info: {} }, "./api.yaml")?.kind).toBe("structure-paths");
	});

	test("non-object paths classifies as structure-paths-object", () => {
		const kind = validateOpenApiSpec({ openapi: "3.0.0", info: {}, paths: "nope" }, "./api.yaml")?.kind;
		expect(kind).toBe("structure-paths-object");
	});

	test("a spec whose only operation has no responses classifies as structure-operations", () => {
		const spec = { openapi: "3.0.0", info: {}, paths: { "/broken": { get: { summary: "no responses" } } } };
		expect(validateOpenApiSpec(spec, "./api.yaml")?.kind).toBe("structure-operations");
	});

	test("a spec with at least one valid operation is not blocked", () => {
		const spec = {
			openapi: "3.0.0",
			info: {},
			paths: { "/items": { get: { responses: { "200": { description: "OK" } } } } },
		};
		expect(validateOpenApiSpec(spec, "./api.yaml")).toBeUndefined();
	});
});

describe("presentOpenApiError", () => {
	test("missing substitutes the path and has no collapsible details", () => {
		const presented = presentOpenApiError({ kind: "missing", path: "./api/petstore.yaml" });
		expect(presented.message).toContain("./api/petstore.yaml");
		expect(presented.message).not.toContain("{path}");
		expect(presented.details).toBeUndefined();
	});

	test("empty substitutes the path", () => {
		const presented = presentOpenApiError({ kind: "empty", path: "./api/petstore.yaml" });
		expect(presented.message).toContain("./api/petstore.yaml");
		expect(presented.message).not.toContain("{path}");
	});

	test("syntax substitutes line/column and keeps the raw parser message as collapsed details", () => {
		const presented = presentOpenApiError({
			kind: "syntax",
			path: "./api.yaml",
			format: "YAML",
			line: 12,
			column: 7,
			details: "bad indentation of a mapping entry (12:7)",
		});
		expect(presented.title).toContain("OpenAPI specification");
		expect(presented.message).toContain("invalid format");
		expect(presented.details).toContain("YAML syntax error: line 12, column 7");
		expect(presented.details).toContain("bad indentation of a mapping entry (12:7)");
		expect(presented.details).not.toMatch(/\{format\}|\{line\}|\{column\}/);
	});

	test("structure errors format the blocking diagnostics into the collapsed details", () => {
		const presented = presentOpenApiError({
			kind: "structure-paths-object",
			path: "./api.yaml",
			diagnostics: [
				{
					severity: "error",
					path: "/paths",
					code: "paths-not-object",
					message: "x",
					expected: "paths object",
					received: "string",
					action: "blocked",
				},
			],
		});
		expect(presented.details).toContain("/paths");
		expect(presented.details).toContain("paths object");
		expect(presented.details).toContain("string");
	});
});

describe("reportOpenApiRenderError (D-path)", () => {
	beforeEach(() => {
		(sendBug as jest.Mock).mockClear();
	});

	test("reports the renderer bug with reproduction metadata", () => {
		const error = new Error("boom");
		reportOpenApiRenderError(error, "render", {
			path: "./api.yaml",
			spec: { openapi: "3.0.4" },
			specText: "openapi: 3.0.4",
			diagnostics: [],
		});

		expect(sendBug).toHaveBeenCalledTimes(1);
		const [reportedError, onError] = (sendBug as jest.Mock).mock.calls[0];
		expect(reportedError).toBe(error);

		const event = { addMetadata: jest.fn() };
		onError(event);
		expect(event.addMetadata).toHaveBeenCalledWith("openapi", {
			path: "./api.yaml",
			phase: "render",
			version: "3.0.4",
			size: "openapi: 3.0.4".length,
			diagnostics: [],
		});
	});

	// Criterion 4 of the Gramax try-it-out US: a reader's Bearer token, Basic password or API key lives in the
	// custom element's memory and must stay there. The renderer bug report is the one place the adapter builds a
	// payload of its own, so the key set is pinned: a later "let's also send the element state" fails here.
	test("carries only spec-derived reproduction facts, never reader input", () => {
		const secret = "s3cret-bearer-token";
		const specText = `openapi: 3.0.4\ncomponents:\n  securitySchemes:\n    bearerAuth:\n      type: http\n`;
		reportOpenApiRenderError(new Error("boom"), "operation-execute", {
			path: "./api.yaml",
			spec: { openapi: "3.0.4", components: { securitySchemes: { bearerAuth: { type: "http" } } } },
			specText,
			diagnostics: [],
		});

		const [, onError] = (sendBug as jest.Mock).mock.calls[0];
		const event = { addMetadata: jest.fn() };
		onError(event);

		const [section, metadata] = event.addMetadata.mock.calls[0];
		expect(section).toBe("openapi");
		expect(Object.keys(metadata).sort()).toEqual(["diagnostics", "path", "phase", "size", "version"]);
		const serialized = JSON.stringify(metadata);
		expect(serialized).not.toContain(secret);
		expect(serialized).not.toContain("securitySchemes");
		expect(serialized).not.toContain(specText);
	});

	test("falls back to swagger version and an empty diagnostics list when omitted", () => {
		const error = new Error("boom");
		reportOpenApiRenderError(error, "editor-preview", {
			path: "./api.yaml",
			spec: { swagger: "2.0" },
			specText: "swagger: '2.0'",
		});

		const [, onError] = (sendBug as jest.Mock).mock.calls[0];
		const event = { addMetadata: jest.fn() };
		onError(event);
		expect(event.addMetadata).toHaveBeenCalledWith(
			"openapi",
			expect.objectContaining({ version: "2.0", diagnostics: [] }),
		);
	});
});
