export async function *genNDJson(gen: AsyncGenerator<unknown, void, void>): AsyncGenerator<string, void, void> {
	for await (const el of gen) {
		yield JSON.stringify(el) + "\n";
	}
}