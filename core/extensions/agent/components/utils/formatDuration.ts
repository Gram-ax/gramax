import t from "@ext/localization/locale/translate";

export const formatElapsed = (ms: number): string => {
	const totalSeconds = Math.max(1, Math.round(ms / 1000));
	if (totalSeconds < 60) return `${totalSeconds}${t("agent.duration-seconds")}`;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const m = t("agent.duration-minutes");
	const s = t("agent.duration-seconds");
	return seconds > 0 ? `${minutes}${m} ${seconds}${s}` : `${minutes}${m}`;
};
