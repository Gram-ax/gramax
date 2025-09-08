import { XxHash } from "@core/Hash/Hasher";

export const WORD_BOOKMARK_MAX = 40;

export const generateBookmarkName = (order: string, title: string, id?: string): string => {
	const parts = [order, title, id ?? ""].filter(Boolean);
	const raw = parts.join("_");
	let name = sanitizeForWord(raw);

	if (name.length > WORD_BOOKMARK_MAX) {
		const suffix = "_" + shortHash(raw);
		const cut = WORD_BOOKMARK_MAX - suffix.length;
		name = sanitizeForWord(name.slice(0, cut)) + suffix;
	}

	return name;
};

function shortHash(input: string): string {
	const hashValue = XxHash.hasher().hash(input).finalize();
	return hashValue.toString(36).slice(0, 5);
}

function sanitizeForWord(s: string): string {
	const cleaned = s
		.replace(/\s+/g, "_")
		.replace(/[^\p{L}\p{N}_]+/gu, "")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");

	if (/^\d/.test(cleaned)) return `b_${cleaned}`;
	return cleaned || "b";
}
