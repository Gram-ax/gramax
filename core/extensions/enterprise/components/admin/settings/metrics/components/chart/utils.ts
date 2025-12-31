import LanguageService from "@core-ui/ContextServices/Language";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { MdtChartsDataSource } from "mdt-charts";
import { ChartDataPoint } from "../../types";

export type AxisLabelFormat = "daily" | "weekly" | "monthly";

const MIN_PIXELS_PER_LABEL = 45;
const MIN_PIXELS_PER_LABEL_WEEKLY = 30;

const AXIS_DATE_FORMATS: Record<AxisLabelFormat, string> = {
	daily: "DD.MM",
	weekly: "MMM DD",
	monthly: "MMM YYYY",
};

const aggregateDataByPeriod = (dataSet: ChartDataPoint[], periodUnit: "week" | "month"): ChartDataPoint[] => {
	const periodMap = new Map<string, { data: ChartDataPoint; firstDate: string }>();

	for (const point of dataSet) {
		const periodKey = dayjs(point.date).startOf(periodUnit).format("YYYY-MM-DD");
		const existing = periodMap.get(periodKey);

		if (existing) {
			existing.data.views += point.views;
			existing.data.visits += point.visits;
			existing.data.visitors += point.visitors;
		} else {
			periodMap.set(periodKey, {
				data: {
					date: point.date,
					views: point.views,
					visits: point.visits,
					visitors: point.visitors,
				},
				firstDate: point.date,
			});
		}
	}

	return Array.from(periodMap.values())
		.map((entry) => entry.data)
		.sort((a, b) => a.date.localeCompare(b.date));
};

const AXIS_DATA_AGGREGATORS: Record<AxisLabelFormat, (dataSet: ChartDataPoint[]) => ChartDataPoint[]> = {
	daily: (dataSet) => dataSet,
	weekly: (dataSet) => aggregateDataByPeriod(dataSet, "week"),
	monthly: (dataSet) => aggregateDataByPeriod(dataSet, "month"),
};

export const getAxisLabelFormat = (dataLength: number, containerWidth: number): AxisLabelFormat => {
	const pixelsPerLabel = containerWidth / dataLength;
	if (pixelsPerLabel >= MIN_PIXELS_PER_LABEL) return "daily";
	if (pixelsPerLabel >= MIN_PIXELS_PER_LABEL_WEEKLY) return "weekly";
	return "monthly";
};

export const transformDataForChart = (
	dataSet: ChartDataPoint[],
	labelFormat: AxisLabelFormat = "daily",
): MdtChartsDataSource => {
	const data = AXIS_DATA_AGGREGATORS[labelFormat](dataSet);
	const locale = LanguageService.currentUi();

	return {
		dataSet: data.map((point) => ({
			$id: point.date,
			date: dayjs(point.date).locale(locale).format(AXIS_DATE_FORMATS[labelFormat]),
			views: point.views,
			visits: point.visits,
			visitors: point.visitors,
		})),
	};
};
