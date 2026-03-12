export type NDJsonReadStream = ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>;

export async function* readNDJson<T>(reader: NDJsonReadStream, signal?: AbortSignal): AsyncGenerator<T, void, void> {
	const decoder = new TextDecoder("utf-8");
	let buffer = "";

	for (;;) {
		if (signal?.aborted) {
			reader.cancel(signal.reason);
			signal.throwIfAborted();
		}

		const { value, done } = await reader.read();
		if (done) {
			break;
		}

		buffer += decoder.decode(value, { stream: true });

		const lines = buffer.split("\n");

		buffer = lines.pop() ?? "";

		for (const line of lines) {
			const item = parseItem<T>(line);
			if (item) yield item;
		}
	}

	for (const line of buffer.split("\n")) {
		const item = parseItem<T>(line);
		if (item) yield item;
	}
}

function parseItem<T>(line: string): T | undefined {
	if (line.trim()) {
		try {
			return JSON.parse(line);
		} catch {
			console.warn("invalid ndjson: ", line);
		}
	}
	return undefined;
}
