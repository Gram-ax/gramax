export type GesErrorCode =
	| "not-configured"
	| "unauthorized"
	| "not-found"
	| "invalid"
	| "unavailable"
	| "offline"
	| "malformed"
	| "unknown";

export class GesError extends Error {
	constructor(
		readonly code: GesErrorCode,
		options?: { cause?: unknown },
	) {
		super(`ges:${code}`, options);
		this.name = "GesError";
	}
}

export const gesErrorCodeByStatus = (status: number): GesErrorCode => {
	if (status === 401 || status === 403) return "unauthorized";
	if (status === 404) return "not-found";
	if (status >= 500) return "unavailable";
	if (status >= 400) return "invalid";
	return "unavailable";
};

export const toGesErrorCode = (error: unknown): GesErrorCode => (error instanceof GesError ? error.code : "unknown");
