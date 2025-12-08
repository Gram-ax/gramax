export async function* readNDJson<T>(
	reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
): AsyncGenerator<T, void, void> {
	const decoder = new TextDecoder("utf-8");
	let buffer = "";

	for (;;) {
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
		} catch (err) {
			console.warn("invalid ndjson: ", line);
		}
	}
	return undefined;
}
