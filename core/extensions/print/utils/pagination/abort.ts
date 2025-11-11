export class PaginationAbortError extends Error {
	constructor(message = "Pagination aborted") {
		super(message);
		this.name = "PaginationAbortError";
	}
}

export const throwIfAborted = (signal?: AbortSignal): void => {
	if (!signal) return;
	if (signal.aborted) {
		const reason = signal.reason;
		const message =
			typeof reason === "string" ? reason : reason instanceof Error ? reason.message : undefined;
		throw new PaginationAbortError(message);
	}
};

export const isPaginationAbortError = (error: unknown): error is PaginationAbortError =>
	error instanceof PaginationAbortError;
