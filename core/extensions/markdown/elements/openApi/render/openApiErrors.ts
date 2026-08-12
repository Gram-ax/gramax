import { ResourceEmptyError } from "@core-ui/ContextServices/ResourceService/errors";
import sendBug from "@ext/bugsnag/logic/sendBug";
import t from "@ext/localization/locale/translate";
import type { OpenApiDiagnostic, OpenApiSpec } from "@gramax/openapi-viewer";
import { validateSpec } from "@gramax/openapi-viewer/core";
import * as yaml from "js-yaml";

/** Codes the core marks `action: "blocked"` that mean "this isn't an OpenAPI spec" (U3). */
const structureCodeToKind: Partial<Record<string, OpenApiStructureErrorKind>> = {
	"input-not-object": "structure-object",
	"paths-missing": "structure-paths",
	"paths-not-object": "structure-paths-object",
	"no-valid-operations": "structure-operations",
};

type OpenApiStructureErrorKind =
	| "structure-object"
	| "structure-paths"
	| "structure-paths-object"
	| "structure-operations";

/** Classified rendering error a reader/author can fix themselves (U1-U3). D (renderer bugs) is handled separately. */
export type OpenApiUserError =
	| { kind: "missing"; path: string }
	| { kind: "empty"; path: string }
	| { kind: "syntax"; path: string; format: "JSON" | "YAML"; line: number; column: number; details: string }
	| { kind: OpenApiStructureErrorKind; path: string; diagnostics: OpenApiDiagnostic[] };

/**
 * Classifies a resource-loading outcome as U1. A zero-byte file never reaches the parser: the resource
 * layer turns it into a ResourceEmptyError with no buffer, so "empty" must be told apart from "missing"
 * here -- otherwise an empty spec is reported as a wrong path, the exact lie this task removes.
 */
export const classifyResourceError = (
	error: unknown,
	buffer: Buffer | undefined,
	path: string,
): OpenApiUserError | undefined => {
	if (error instanceof ResourceEmptyError) return { kind: "empty", path };
	if (error || !buffer) return { kind: "missing", path };
	return undefined;
};

const jsonSyntaxPosition = (text: string, message: string): { line: number; column: number } => {
	const explicitPosition = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
	if (explicitPosition) return { line: Number(explicitPosition[1]), column: Number(explicitPosition[2]) };

	const offset = Number(message.match(/position\s+(\d+)/i)?.[1]);
	if (!Number.isFinite(offset)) return { line: 1, column: 1 };
	const beforeError = text.slice(0, offset);
	const lastLineBreak = beforeError.lastIndexOf("\n");
	return {
		line: beforeError.split("\n").length,
		column: offset - lastLineBreak,
	};
};

/** Parses spec text, classifying an empty file (U1) or a JSON/YAML syntax error (U2) before structure is checked. */
export const parseOpenApiText = (text: string, path: string): { spec?: OpenApiSpec; error?: OpenApiUserError } => {
	if (!text.trim()) return { error: { kind: "empty", path } };
	const format = /\.json(?:$|[?#])/i.test(path) ? "JSON" : "YAML";
	try {
		return { spec: (format === "JSON" ? JSON.parse(text) : yaml.load(text)) as OpenApiSpec };
	} catch (err) {
		if (format === "JSON" && err instanceof SyntaxError) {
			const position = jsonSyntaxPosition(text, err.message);
			return {
				error: {
					kind: "syntax",
					path,
					format,
					...position,
					details: err.message,
				},
			};
		}
		if (format === "YAML" && err instanceof yaml.YAMLException) {
			return {
				error: {
					kind: "syntax",
					path,
					format,
					line: (err.mark?.line ?? 0) + 1,
					column: (err.mark?.column ?? 0) + 1,
					details: err.message,
				},
			};
		}
		throw err;
	}
};

/** Reports a renderer bug (D) to Bugsnag with enough context to reproduce it; shared by the article render and the spec editor preview. */
export const reportOpenApiRenderError = (
	error: Error,
	phase: string,
	context: { path: string; spec?: OpenApiSpec; specText: string; diagnostics?: OpenApiDiagnostic[] },
): void => {
	void sendBug(error, (event) => {
		event.addMetadata("openapi", {
			path: context.path,
			phase,
			version: context.spec?.openapi ?? context.spec?.swagger ?? "unknown",
			size: context.specText.length,
			diagnostics: context.diagnostics ?? [],
		});
	});
};

/** Runs the core's lightweight validation and classifies a blocking result as a U3 "not an OpenAPI spec" error. */
export const validateOpenApiSpec = (spec: unknown, path: string): OpenApiUserError | undefined => {
	const { diagnostics } = validateSpec(spec);
	const blocking = diagnostics.filter((item) => item.action === "blocked");
	if (!blocking.length) return undefined;
	const kind = structureCodeToKind[blocking[0].code] ?? "structure-object";
	return { kind, path, diagnostics: blocking };
};

const formatDiagnostics = (diagnostics: OpenApiDiagnostic[]): string =>
	diagnostics
		.map(
			(item) =>
				`${item.path || "/"} — ${t("openApi.errors.expected")} ${item.expected}, ${t("openApi.errors.received")} ${item.received}`,
		)
		.join("\n");

/** Builds the localized title/message/details for a classified U1-U3 error, ready for DiagramError. */
export const presentOpenApiError = (error: OpenApiUserError): { title: string; message: string; details?: string } => {
	const title = t("openApi.errors.title");
	switch (error.kind) {
		case "missing":
			return { title, message: t("openApi.errors.missing").replace("{path}", error.path) };
		case "empty":
			return { title, message: t("openApi.errors.empty").replace("{path}", error.path) };
		case "syntax":
			return {
				title,
				message: t("openApi.errors.invalidFormat"),
				details: `${t("openApi.errors.syntax")
					.replace("{format}", error.format)
					.replace("{line}", String(error.line))
					.replace("{column}", String(error.column))}\n${error.details}`,
			};
		case "structure-object":
			return {
				title,
				message: t("openApi.errors.structureObject"),
				details: formatDiagnostics(error.diagnostics),
			};
		case "structure-paths":
			return {
				title,
				message: t("openApi.errors.structurePaths"),
				details: formatDiagnostics(error.diagnostics),
			};
		case "structure-paths-object":
			return {
				title,
				message: t("openApi.errors.structurePathsObject"),
				details: formatDiagnostics(error.diagnostics),
			};
		case "structure-operations":
			return {
				title,
				message: t("openApi.errors.structureOperations"),
				details: formatDiagnostics(error.diagnostics),
			};
	}
};
