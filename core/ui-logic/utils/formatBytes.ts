import t from "@ext/localization/locale/translate";

// Helper function to split bytes into a human-readable value and its unit
export const formatBytesParts = (bytes: number, decimals = 2): { value: string; unit: string } => {
	const sizes = [t("git.clone.etc.b"), t("git.clone.etc.kb"), t("git.clone.etc.mb"), t("git.clone.etc.gb")];
	if (bytes === 0) return { value: "0", unit: sizes[0] };

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return { value: String(Number.parseFloat((bytes / k ** i).toFixed(dm))), unit: sizes[i] };
};

// Helper function to format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
	const { value, unit } = formatBytesParts(bytes, decimals);
	return `${value} ${unit}`;
};
