type RetryResult<T> = { type: "success"; value: T } | { type: "break" } | { type: "continue" } | undefined;

export async function withRetries<T>(
	func: () => Promise<RetryResult<T>>,
	maxRetryCount: number = 3,
	retryDelayMs: number = 10000,
): Promise<T | undefined> {
	for (let attempt = 0; attempt < maxRetryCount; attempt++) {
		const result = await func();

		if (result?.type === "success") return result.value;
		if (result?.type === "break") break;

		if (attempt < maxRetryCount) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
	}

	return undefined;
}
