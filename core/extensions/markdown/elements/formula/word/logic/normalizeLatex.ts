export type NormalizeResult = { latex: string; display: boolean };

export const normalizeLatex = (value?: string): NormalizeResult => {
	if (!value) return { latex: "", display: false };
	const trimmed = value.trim();

	if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
		return { latex: trimmed.slice(2, -2).trim(), display: true };
	}

	if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
		return { latex: trimmed.slice(1, -1).trim(), display: false };
	}

	return { latex: trimmed, display: false };
};
