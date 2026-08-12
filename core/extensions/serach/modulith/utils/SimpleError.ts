const UNKNOWN = "Unknown";

export interface SimpleError {
	name: string;
	message: string;
	stack?: string;
	cause?: unknown;
}

export const createSimpleError = (error: Error): SimpleError => {
	if (!error)
		return {
			name: UNKNOWN,
			message: "null",
		};

	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		cause: getCause(error.cause),
	};
};

const getCause = (cause: unknown): unknown => {
	if (!cause) return undefined;

	if (cause instanceof Error) {
		return createSimpleError(cause);
	}

	if (typeof cause === "object") {
		return traverseObject(cause);
	}

	return {
		name: UNKNOWN,
		message: String(cause),
	};
};

const traverseObject = (obj: object): Record<string, unknown> => {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== null && typeof value === "object") {
			result[key] = traverseObject(value as Record<string, unknown>);
		} else {
			result[key] = String(value);
		}
	}

	return result;
};
