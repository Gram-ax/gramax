export class AsyncNotifier {
	private resolveNext: (() => void) | null = null;

	notify() {
		if (this.resolveNext) {
			this.resolveNext();
			this.resolveNext = null;
		}
	}

	waitNext(timeout?: number): Promise<void> {
		return new Promise((resolve) => {
			const timeoutId = timeout
				? setTimeout(() => {
						resolve();
					}, timeout)
				: undefined;
			this.resolveNext = () => {
				clearTimeout(timeoutId);
				resolve();
			};
		});
	}
}
