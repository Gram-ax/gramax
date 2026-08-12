import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { type OpenApiRefFiles, resolveOpenApiRefKey } from "@ext/markdown/elements/openApi/OpenApiRefFiles";
import type { OpenApiSpec } from "@gramax/openapi-viewer";
import { inlineOpenApiRefs } from "@gramax/openapi-viewer/adapters/inline";

/** Fetches parsed external $ref files for `specText` from the backend. Never throws -- callers treat a
 * failure the same as "no external files available" and let the core renderer's own validation surface
 * the unresolved-ref diagnostic. */
export const fetchOpenApiRefFiles = async (
	apiUrlCreator: ApiUrlCreator,
	src: string,
	specText: string,
): Promise<OpenApiRefFiles> => {
	try {
		const res = await FetchService.fetch<{ files?: OpenApiRefFiles }>(
			apiUrlCreator.getOpenApiAllRefFiles(src),
			JSON.stringify({ spec: specText }),
			MimeTypes.json,
			Method.POST,
			false,
		);
		if (!res.ok) return {};
		const data = await res.json();
		return data?.files ?? {};
	} catch {
		return {};
	}
};

/** Inlines external (and internal) $ref pointers over an already-parsed spec plus its resolved external files. */
export const bundleOpenApiSpec = (src: string, spec: OpenApiSpec, files: OpenApiRefFiles): OpenApiSpec =>
	inlineOpenApiRefs(src, { files: { [src]: spec, ...files }, resolveKey: resolveOpenApiRefKey }).spec;
