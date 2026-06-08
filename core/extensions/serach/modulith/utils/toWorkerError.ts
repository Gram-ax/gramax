import type { SimpleError } from "@ext/serach/modulith/utils/SimpleError";

export const toWorkerError = (error: SimpleError): Error => {
	const rawTitle = error.name ? `${error.name}: ${error.message}` : error.message;
	const title = rawTitle.trim() || "<unknown>";
	const details = flattenWorkerError(error);
	const workerError = new Error(`Worker request failed: ${title}`);
	workerError.name = error.name || "Error";
	workerError.stack = details;
	return workerError;
};

const flattenWorkerError = (error: SimpleError): string => {
	let result = error.stack ?? `${error.name}: ${error.message}`;
	let cur = error.cause;
	while (cur && typeof cur === "object") {
		const cTitle = `${cur.name ?? "Error"}: ${cur.message ?? ""}`.trim();
		result += `\nCaused by: ${cur.stack ?? cTitle}`;
		cur = cur.cause;
	}
	return result;
};
