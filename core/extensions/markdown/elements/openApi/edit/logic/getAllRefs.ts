import type Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import { span } from "@ext/loggers/opentelemetry";
import {
	type OpenApiRefFiles,
	type OpenApiRefsData,
	resolveOpenApiRefPath,
} from "@ext/markdown/elements/openApi/OpenApiRefFiles";
import * as yaml from "js-yaml";

export const collectRefsFromJson = (json: unknown): string[] => {
	const collectRefsRecursively = (obj: unknown, refs = new Set<string>()) => {
		if (!obj || typeof obj !== "object") {
			return refs;
		}

		const ref = (obj as Record<string, unknown>).$ref;
		if (typeof ref === "string") {
			refs.add(ref);
		}

		if (Array.isArray(obj)) {
			obj.forEach((item) => collectRefsRecursively(item, refs));
		} else {
			Object.values(obj).forEach((value) => collectRefsRecursively(value, refs));
		}

		return refs;
	};

	const refs = [...collectRefsRecursively(json)];
	const files = refs.filter((ref) => !ref.startsWith("#")).map((ref) => ref.split("#")[0]);

	return [...new Set(files)];
};

const getAllRefs = async (path: Path, rm: ResourceManager, json: unknown, silent = false) => {
	const allRefs: string[] = [];
	const files: OpenApiRefFiles = {};
	const visitedPaths = new Set<string>();

	const collectResources = async (path: Path, rm: ResourceManager, json: unknown) => {
		const refs = collectRefsFromJson(json);

		await refs.forEachAsync(async (ref) => {
			const resolvedPath = resolveOpenApiRefPath(path, ref);
			const resolvedPathValue = resolvedPath.value;

			if (visitedPaths.has(resolvedPathValue)) return;
			visitedPaths.add(resolvedPathValue);
			allRefs.push(resolvedPathValue);

			if (!silent) rm.set(resolvedPath);

			const content = await rm.getContent(resolvedPath, undefined, true);

			try {
				const json = yaml.load(content.toString());
				files[resolvedPathValue] = json;
				await collectResources(resolvedPath, rm, json);
			} catch (e) {
				const currentSpan = span();
				currentSpan?.addEvent("openapi-ref-parse-failed", {
					path: rm.getAbsolutePath(resolvedPath).value,
				});
				currentSpan?.recordException(e as Error);
			}
		});
	};
	await collectResources(path, rm, json);

	return { refs: allRefs, files } satisfies OpenApiRefsData;
};

/**
 * Registers every file the spec pulls in through `$ref` as a resource of the article, so the client can
 * fetch them later. That registration is `getAllRefs`'s `rm.set` side effect -- the returned ref list has
 * no consumer, and calling it under this name keeps the parser from looking like it computes something.
 */
export const registerOpenApiRefResources = async (path: Path, rm: ResourceManager, json: unknown): Promise<void> => {
	await getAllRefs(path, rm, json);
};

export const getAllRefsFromSpec = async (
	src: Path,
	rm: ResourceManager,
	content?: string,
): Promise<OpenApiRefFiles> => {
	const specContent = content ?? (await rm.getContent(src, undefined, true))?.toString();

	if (!specContent) return {};

	try {
		const json = yaml.load(specContent);
		return (await getAllRefs(src, rm, json, true)).files;
	} catch (e) {
		const currentSpan = span();
		currentSpan?.addEvent("openapi-spec-parse-failed", { path: rm.getAbsolutePath(src).value });
		currentSpan?.recordException(e as Error);
		return {};
	}
};

export default getAllRefs;
