export class AsyncNotifier {
	private resolveNext: (() => void) | null = null;

	notify() {
		if (this.resolveNext) {
			this.resolveNext();
			this.resolveNext = null;
		}
	}

	waitNext(): Promise<void> {
		return new Promise((resolve) => {
			this.resolveNext = resolve;
		});
	}
}
