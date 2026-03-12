import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import type Path from "@core/FileProvider/Path/Path";
import { isLikelyLfsPointer } from "@core/GitLfs/utils";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import {
	LfsPointerError,
	type ResourceError,
	ResourceLoadError,
	ResourceNotFoundError,
} from "@core-ui/ContextServices/ResourceService/errors";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";

export type ResourceFetchResult = { buffer?: Buffer; error?: ResourceError };

interface LoadInternalDataProps {
	src: string;
	apiUrlCreator: ApiUrlCreator;
	catalogName: string;
	id: string;
	provider: ArticleProviderType;
}

export function checkLfsPointer(buffer: Buffer, src: string): ResourceError | undefined {
	if (isLikelyLfsPointer(buffer)) return new LfsPointerError(src);
	return undefined;
}

export async function fetchImage(src: string): Promise<ResourceFetchResult> {
	try {
		const res = await fetch(src);
		if (!res.ok) {
			return { error: new ResourceNotFoundError(src) };
		}
		const blob = await res.blob();
		const buffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
		return { buffer };
	} catch (e) {
		return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
	}
}

export async function fetchInTauri(src: string): Promise<ResourceFetchResult> {
	try {
		const res = await resolveModule("httpFetch")({ url: src });
		if (!res?.body || res.body.type !== "binary") {
			return { error: new ResourceNotFoundError(src) };
		}
		return { buffer: Buffer.from(res.body.data) };
	} catch (e) {
		return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
	}
}

export async function loadExternalData(src: string): Promise<ResourceFetchResult> {
	const result = getExecutingEnvironment() === "tauri" ? await fetchInTauri(src) : await fetchImage(src);
	return result;
}

export async function loadInternalData(props: LoadInternalDataProps): Promise<ResourceFetchResult> {
	const { src, apiUrlCreator, catalogName, id, provider } = props;
	const url = apiUrlCreator.getArticleResource(src, undefined, catalogName, id, provider);
	try {
		const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);
		if (!res.ok) {
			return { error: new ResourceNotFoundError(src) };
		}
		const buffer = await res.buffer();
		const lfsError = checkLfsPointer(buffer, src);
		if (lfsError) return { error: lfsError };
		return { buffer };
	} catch (e) {
		return { error: new ResourceLoadError(src, e instanceof Error ? e : undefined) };
	}
}

export async function getNoParentResource(path: Path, apiUrlCreator: ApiUrlCreator): Promise<ResourceFetchResult> {
	const url = apiUrlCreator.getResourceByPath(path.value);
	try {
		const res = await FetchService.fetch(url, undefined, MimeTypes.text, Method.POST, false);
		if (!res.ok) {
			return { error: new ResourceNotFoundError(path.value) };
		}
		const buffer = await res.buffer();
		const lfsError = checkLfsPointer(buffer, path.value);
		if (lfsError) return { error: lfsError };
		return { buffer };
	} catch (e) {
		return {
			error: new ResourceLoadError(path.value, e instanceof Error ? e : undefined),
		};
	}
}
