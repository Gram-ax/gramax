import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import dayjs from "dayjs";
import "dayjs/locale/ru";

export const DEFAULT_CHART_COLORS = {
	views: "#60A5FA",
	visits: "#A78BFA",
	visitors: "#34D399",
} as const;

export const getChartColors = (): { views: string; visits: string; visitors: string } => {
	return DEFAULT_CHART_COLORS;
};

export type PresetInterval = "day" | "yesterday" | "thisWeek" | "week" | "last28Days" | "month" | "lastMonth" | "year";
export type MetricsInterval = PresetInterval | "custom";

const DEFAULT_PAGE_SIZE = 50;

export const getPageSize = (): number => {
	return DEFAULT_PAGE_SIZE;
};

export const PAGE_SIZE = getPageSize();

const PRESET_INTERVALS: readonly PresetInterval[] = [
	"day",
	"yesterday",
	"thisWeek",
	"week",
	"last28Days",
	"month",
	"lastMonth",
	"year",
] as const;

export const isPresetInterval = (interval: MetricsInterval): interval is PresetInterval => {
	return PRESET_INTERVALS.includes(interval as PresetInterval);
};

export const getDateRangeForInterval = (interval: PresetInterval): { startDate: string; endDate: string } => {
	const now = dayjs();
	let startDate: dayjs.Dayjs;
	let endDate: dayjs.Dayjs;

	switch (interval) {
		case "day":
			startDate = now.startOf("day");
			endDate = now.add(1, "day").startOf("day");
			break;
		case "yesterday":
			startDate = now.subtract(1, "day").startOf("day");
			endDate = now.startOf("day");
			break;
		case "thisWeek":
			startDate = now.startOf("week");
			endDate = now.add(1, "day").startOf("day");
			break;
		case "week":
			startDate = now.subtract(6, "day").startOf("day");
			endDate = now.add(1, "day").startOf("day");
			break;
		case "last28Days":
			startDate = now.subtract(27, "day").startOf("day");
			endDate = now.add(1, "day").startOf("day");
			break;
		case "month":
			startDate = now.startOf("month");
			endDate = now.add(1, "day").startOf("day");
			break;
		case "lastMonth":
			startDate = now.subtract(1, "month").startOf("month");
			endDate = now.subtract(1, "month").endOf("month").add(1, "day").startOf("day");
			break;
		case "year":
			startDate = now.startOf("year");
			endDate = now.add(1, "day").startOf("day");
			break;
	}

	return {
		startDate: startDate.format("YYYY-MM-DD"),
		endDate: endDate.format("YYYY-MM-DD"),
	};
};

export const getDisplayText = (startDate: string, endDate: string): string => {
	const language = LanguageService.currentUi();
	const start = dayjs(startDate).locale(language);
	const end = dayjs(endDate).subtract(1, "day").locale(language);
	return `${t("metrics.data-for")} ${start.format("DD.MM")} - ${end.format("DD.MM, YYYY")}`;
};
