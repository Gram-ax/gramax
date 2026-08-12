import resolveModule from "@app/resolveModule/frontend";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type HttpRequestInput = {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
};

type HttpRequestResult = {
	status: number;
	statusText: string;
	ok: boolean;
	body: string;
};

async function requestInTauri(
	url: string,
	method: string,
	headers?: Record<string, string>,
	body?: string,
): Promise<HttpRequestResult | null> {
	const res = await resolveModule("httpFetch")({
		url,
		method,
		headers,
		body: method !== "GET" && body !== undefined ? body : undefined,
	});
	if (!res) return null;

	return {
		status: res.status,
		statusText: res.statusText ?? "",
		ok: res.status >= 200 && res.status < 300,
		body: res.body?.type === "text" ? res.body.data : "",
	};
}

async function requestInBrowser(
	url: string,
	method: string,
	headers?: Record<string, string>,
	body?: string,
): Promise<HttpRequestResult> {
	const res = await fetch(url, {
		method,
		headers,
		body: method !== "GET" && body !== undefined ? body : undefined,
	});
	return {
		status: res.status,
		statusText: res.statusText,
		ok: res.ok,
		body: await res.text(),
	};
}

export async function runHttpRequest({ input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { url, method: rawMethod, headers, body } = input as HttpRequestInput;

	if (!url?.trim()) {
		return fail("url is required");
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return fail(`Invalid url: ${url}`);
	}

	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		return fail(`Only http and https URLs are supported, got: ${parsedUrl.protocol}`);
	}

	const method = (rawMethod ?? "GET").toUpperCase();
	if (!HTTP_METHODS.includes(method as HttpMethod)) {
		return fail(`Unsupported method: ${rawMethod ?? method}. Allowed: ${HTTP_METHODS.join(", ")}`);
	}

	const requestUrl = parsedUrl.toString();
	const requestBody = method !== "GET" && body !== undefined ? body : undefined;

	try {
		const result =
			(await requestInTauri(requestUrl, method, headers, requestBody)) ??
			(await requestInBrowser(requestUrl, method, headers, requestBody));
		return ok(result);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`HTTP request failed: ${msg}`);
	}
}
