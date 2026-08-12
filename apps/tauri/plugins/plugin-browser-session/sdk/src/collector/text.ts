import type { CollectorConfig } from "./config";

export class TextNormalizer {
	constructor(private readonly _config: CollectorConfig) {}

	normalize(value: unknown, limit = this._config.maxTextLength): string {
		return String(value || "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, limit);
	}

	joinPunctuation(value: string): string {
		return value.replace(/\s+([,.;:!?…»)\]])/g, "$1").replace(/([«([])\s+/g, "$1");
	}

	hasLettersOrDigits(value: string): boolean {
		return /[\p{L}\p{N}]/u.test(value);
	}

	isPunctuationOnly(value: string): boolean {
		return value.length <= 2 || !this.hasLettersOrDigits(value);
	}

	quote(value: string): string {
		return `"${value.replace(/"/g, '\\"')}"`;
	}

	cleanUrl(url: string): string {
		if (!url) {
			return "";
		}

		try {
			const parsed = new URL(url);
			return `${parsed.origin}${parsed.pathname}`;
		} catch (_) {
			return String(url).split("?")[0];
		}
	}
}
