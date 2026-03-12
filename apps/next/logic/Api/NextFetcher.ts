/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import type Url from "@core-ui/ApiServices/Types/Url";
import LanguageServiceModule from "@core-ui/ContextServices/Language";
import LocalizerModule from "@ext/localization/core/Localizer";

const nextFetch = async (
	url: Url,
	body?: BodyInit,
	mime?: any,
	method?: any,
	signal?: AbortSignal,
): Promise<Response & { buffer: () => Promise<Buffer> }> => {
	let pathname = "";
	if (typeof window !== "undefined") {
		if (!url?.basePath) pathname = window.location.pathname;
		else pathname = window.location.pathname.replace(url.basePath, "");
	}
	const l = LocalizerModule.extract(pathname);
	const headers = {
		"Content-Type": mime,
		"x-gramax-ui-language": LanguageServiceModule.currentUi(),
		"x-gramax-language": l,
	};

	let res: Response;
	try {
		res = await fetch(url.toString(), body ? { method, body, headers, signal } : { headers, signal });
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") {
			throw e;
		}

		const error = new Error(`[${url.pathname}] ${(e as Error).message}`);
		error.stack = (e as Error).stack;
		throw error;
	}

	(res as any).buffer = async () => Buffer.from(await res.arrayBuffer());
	return res as any;
};

export default nextFetch;
