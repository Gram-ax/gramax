export class NGramIndex<TItem extends { id: unknown }> {
	private readonly _index = new Map<string, Set<TItem>>();
	private readonly _documents = new Map<unknown, string[][]>();

	constructor(private readonly _N = 3) {}

	setTexts(item: TItem, texts: string[]): void {
		const tokenized = texts.map((t) => this.tokenize(t));

		const oldTexts = this._documents.get(item.id);
		if (oldTexts !== undefined) {
			for (const tokens of oldTexts) {
				this.removeFromIndex(item, tokens);
			}
		}

		this._documents.set(item.id, tokenized);

		for (const tokens of tokenized) {
			this.addToIndex(item, tokens);
		}
	}

	remove(item: TItem) {
		const texts = this._documents.get(item.id);
		if (!texts) return;

		for (const tokens of texts) {
			this.removeFromIndex(item, tokens);
		}
		this._documents.delete(item.id);
	}

	search(query: string, threshold = 0.6): TItem[] {
		const tokens = this.tokenize(query);
		if (tokens.length === 0) return [];

		const qgrams = tokens.flatMap((t) => this.ngrams(t));

		const candidates = new Set<TItem>();
		for (const g of qgrams) {
			const items = this._index.get(g);
			if (items !== undefined) items.forEach((x) => candidates.add(x));
		}

		const result: TItem[] = [];

		for (const item of candidates) {
			const itemTexts = this._documents.get(item.id)!;

			let matched = false;

			for (const tokens of itemTexts) {
				const docGrams = new Set(tokens.flatMap((t) => this.ngrams(t)));

				const intersection = qgrams.filter(g => docGrams.has(g)).length;
				const union = new Set([...qgrams, ...docGrams]).size;

				const score = intersection / union;
				if (score >= threshold) {
					matched = true;
					break;
				}
			}

			if (matched) result.push(item);
		}

		return result;
	}

	private tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[^\p{L}\p{N}\s]+/gu, "")
			.split(/\s+/)
			.filter(Boolean);
	}

	private addToIndex(item: TItem, words: string[]) {
		for (const w of words) {
			for (const gram of this.ngrams(w)) {
				const ex = this._index.get(gram);
				if (ex === undefined) this._index.set(gram, new Set([item]));
				else ex.add(item);
			}
		}
	}

	private removeFromIndex(item: TItem, words: string[]) {
		for (const w of words) {
			for (const gram of this.ngrams(w)) {
				const set = this._index.get(gram);
				if (!set) continue;
				set.delete(item);
				if (set.size === 0) this._index.delete(gram);
			}
		}
	}

	private ngrams(word: string): string[] {
		if (word.length <= this._N) return [word];
		const grams: string[] = [];
		for (let i = 0; i <= word.length - this._N; i++) {
			grams.push(word.slice(i, i + this._N));
		}
		return grams;
	}
}
