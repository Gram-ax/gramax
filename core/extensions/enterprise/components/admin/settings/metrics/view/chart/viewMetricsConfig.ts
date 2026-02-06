import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import type { DesignerConfig, MdtChartsConfig, MdtChartsDataSource } from "mdt-charts";
import { type AxisLabelFormat, aggregateByPeriod, formatDateForAxis } from "../../components/chart/chartUtils";
import type { ChartValueField } from "../../components/chart/configs/MetricsChartConfig.interface";
import type { ChartDataPoint } from "../../types";

const CHART_HEIGHT = 300;

export const VIEW_FIELD_NAMES = ["visitors", "visits", "views"] as const;
export type ViewMetricField = (typeof VIEW_FIELD_NAMES)[number];

const VIEW_CHART_COLORS: Record<ViewMetricField, string> = {
	views: "#60A5FA",
	visits: "#A78BFA",
	visitors: "#34D399",
};

const aggregateViewData = (dataSet: ChartDataPoint[], format: AxisLabelFormat): ChartDataPoint[] => {
	if (format === "daily") return dataSet;

	const periodUnit = format === "weekly" ? "week" : "month";
	return aggregateByPeriod(dataSet, periodUnit, (existing, point) => {
		existing.views += point.views;
		existing.visits += point.visits;
		existing.visitors += point.visitors;
	});
};

const transformViewData = (dataSet: unknown[], labelFormat?: string): MdtChartsDataSource => {
	const data = dataSet as ChartDataPoint[];
	const format = (labelFormat || "daily") as AxisLabelFormat;
	const aggregated = aggregateViewData(data, format);

	return {
		dataSet: aggregated.map((point) => ({
			$id: point.date,
			date: formatDateForAxis(point.date, format),
			views: point.views,
			visits: point.visits,
			visitors: point.visitors,
		})),
	};
};
const fields: ChartValueField<ViewMetricField>[] = [
	{
		name: "visitors",
		format: "integer",
		title: t("metrics.chart.visitors"),
	},
	{ name: "visits", format: "integer", title: t("metrics.chart.visits") },
	{ name: "views", format: "integer", title: t("metrics.chart.views") },
];

const createChartConfig = (width: number, visibleFields?: ViewMetricField[]): MdtChartsConfig => {
	const activeFields = visibleFields ? fields.filter((f) => visibleFields.includes(f.name)) : [...fields];

	return {
		canvas: {
			class: "metrics-chart",
			size: { width, height: CHART_HEIGHT },
		},
		options: {
			type: "2d",
			orientation: "vertical",
			selectable: true,
			legend: { show: false },
			data: {
				dataSource: "dataSet",
				keyField: { name: "date", format: "string" },
			},
			tooltip: {
				aggregator: {
					content: ({ row }) => {
						return [
							{
								type: "captionValue",
								caption: t("metrics.chart.total"),
								value: (row.views + row.visits + row.visitors).toLocaleString(),
							},
						];
					},
					position: "underValues",
				},
				rows: {
					sortCompareFn: (aRow, bRow) => bRow.textContent.value - aRow.textContent.value,
				},
			},
			axis: {
				key: {
					visibility: true,
					position: "end",
					ticks: { flag: false },
					labels: {
						position: "straight",
					},
				},
				value: {
					visibility: true,
					position: "start",
					domain: { start: -1, end: -1 },
					ticks: { flag: true },
				},
			},
			additionalElements: {
				gridLine: { flag: { value: true, key: false } },
			},
			charts: [
				{
					type: "area",
					isSegmented: false,
					embeddedLabels: "none",
					markers: { show: false },
					data: { valueFields: [...activeFields] },
					valueLabels: { on: false },
					areaStyles: {
						gradient: {
							on: true,
						},
						borderLine: {
							on: true,
						},
					},
				},
			],
		},
	};
};

const createDesignerConfig = (visibleFields?: ViewMetricField[]): DesignerConfig => {
	const activeFields = visibleFields ? fields.filter((f) => visibleFields.includes(f.name)) : [...fields];
	const colors = activeFields.map((field) => VIEW_CHART_COLORS[field.name]);

	return {
		canvas: {
			axisLabel: { maxSize: { main: 80 } },
			legendBlock: { maxWidth: 200, static: { maxLinesAmount: 2 } },
			chartBlockMargin: { top: 40, right: 40, bottom: 20, left: 20 },
			chartOptions: {
				bar: {
					minBarWidth: 3,
					maxBarWidth: 30,
					groupMinDistance: 6,
					barDistance: 2,
					groupMaxDistance: 35,
				},
				donut: {
					padAngle: 0,
					thickness: { min: "10%", max: "30%" },
					aggregatorPad: 10,
				},
			},
		},
		chartStyle: {
			baseColors: colors,
		},
		elementsOptions: {
			tooltip: { position: "followCursor" },
		},
		dataFormat: {
			formatters: (value) => {
				if (typeof value !== "number") return value?.toString() ?? "";
				const locale = LanguageService.currentUi();
				return new Intl.NumberFormat(locale, {
					notation: "compact",
					maximumFractionDigits: 1,
				}).format(value);
			},
		},
	};
};

export const viewMetricsChartConfig = {
	fields,
	colors: VIEW_CHART_COLORS,
	createChartConfig,
	createDesignerConfig,
	transformData: transformViewData,
};
