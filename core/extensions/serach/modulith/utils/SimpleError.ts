export interface SimpleError {
	name: string;
	message: string;
	stack?: string;
	cause?: SimpleError;
}

export function createSimpleError(error: Error): SimpleError {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		cause:
			error.cause instanceof Error
				? createSimpleError(error.cause)
				: {
						name: "Unknown",
						message: String(error.cause),
					},
	};
}
