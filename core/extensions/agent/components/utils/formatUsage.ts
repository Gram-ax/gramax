export const formatTokenCount = (value: number): string => {
	if (!Number.isFinite(value) || value < 0) return "0";
	if (value >= 1_000_000) {
		const m = value / 1_000_000;
		return `${m >= 100 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, "")}M`;
	}
	if (value >= 1_000) {
		const k = value / 1_000;
		return `${k >= 100 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "")}K`;
	}
	return Math.round(value).toString();
};

export const formatPercent = (value: number): string => {
	if (!Number.isFinite(value) || value <= 0) return "0";
	if (value < 10) return value.toFixed(1);
	return Math.round(value).toString();
};
