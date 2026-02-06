import t from "@ext/localization/locale/translate";

// Helper function to format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
	if (bytes === 0) return "0 " + t("git.clone.etc.b");

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [t("git.clone.etc.b"), t("git.clone.etc.kb"), t("git.clone.etc.mb"), t("git.clone.etc.gb")];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
