import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import type { DesignerConfig, MdtChartsConfig, MdtChartsDataSource } from "mdt-charts";
import { type AxisLabelFormat, aggregateByPeriod, formatDateForAxis } from "../../components/chart/chartUtils";
import type { ChartValueField } from "../../components/chart/configs/MetricsChartConfig.interface";
import type { SearchChartDataPoint } from "../../types";

const CHART_HEIGHT = 300;

export const SEARCH_FIELD_NAMES = ["totalSearches", "avgCTR", "noClickRate", "refinementRate"] as const;
export type SearchMetricField = (typeof SEARCH_FIELD_NAMES)[number];

export const SEARCH_CHART_COLORS: Record<SearchMetricField, string> = {
	avgCTR: "#34D399",
	refinementRate: "#A78BFA",
	noClickRate: "#FBBF24",
	totalSearches: "#60A5FA",
};

const aggregateSearchData = (dataSet: SearchChartDataPoint[], format: AxisLabelFormat): SearchChartDataPoint[] => {
	if (format === "daily") return dataSet;

	const periodUnit = format === "weekly" ? "week" : "month";
	const countsMap = new Map<string, number>();

	const result = aggregateByPeriod(dataSet, periodUnit, (existing, point) => {
		const key = existing.date;
		const count = (countsMap.get(key) || 1) + 1;
		countsMap.set(key, count);

		existing.totalSearches += point.totalSearches;
		existing.avgCTR = (existing.avgCTR * (count - 1) + point.avgCTR) / count;
		existing.noClickRate = (existing.noClickRate * (count - 1) + point.noClickRate) / count;
		existing.refinementRate = (existing.refinementRate * (count - 1) + point.refinementRate) / count;
	});

	return result;
};

const transformSearchData = (dataSet: unknown[], labelFormat?: string): MdtChartsDataSource => {
	const data = dataSet as SearchChartDataPoint[];
	const format = (labelFormat || "daily") as AxisLabelFormat;
	const aggregated = aggregateSearchData(data, format);

	return {
		dataSet: aggregated.map((point) => ({
			$id: point.date,
			date: formatDateForAxis(point.date, format),
			totalSearches: point.totalSearches,
			avgCTR: point.avgCTR / 100,
			noClickRate: point.noClickRate / 100,
			refinementRate: point.refinementRate / 100,
		})),
	};
};

const getFields = (): ChartValueField<SearchMetricField>[] => [
	{
		name: "totalSearches",
		format: "integer",
		title: t("metrics.chart.totalSearches"),
	},
	{ name: "avgCTR", format: "percent", title: t("metrics.chart.avgCTR") },
	{
		name: "noClickRate",
		format: "percent",
		title: t("metrics.chart.noClickRate"),
	},
	{
		name: "refinementRate",
		format: "percent",
		title: t("metrics.chart.refinementRate"),
	},
];

const createChartConfig = (width: number, visibleFields?: SearchMetricField[]): MdtChartsConfig => {
	const fields = getFields();
	const activeFields = visibleFields ? fields.filter((f) => visibleFields.includes(f.name)) : [...fields];

	const totalSearchesField = activeFields.find((f) => f.name === "totalSearches");
	const percentageFields = activeFields.filter((f) => f.name !== "totalSearches");

	return {
		canvas: {
			class: "search-metrics-chart",
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
				valueSecondary: {
					visibility: true,
					domain: { start: -1, end: -1 },
					ticks: { flag: true },
					labels: {
						format: (value) => `${(value * 100).toFixed(0)}%`,
					},
				},
			},
			additionalElements: {
				gridLine: { flag: { value: true, key: false } },
			},
			charts: [
				...(totalSearchesField
					? [
							{
								type: "area" as const,
								isSegmented: false,
								embeddedLabels: "none" as const,
								markers: { show: false },
								data: {
									valueFields: [
										{
											color: SEARCH_CHART_COLORS.totalSearches,
											...totalSearchesField,
										},
									],
									valueGroup: "main" as const,
								},
								valueLabels: { on: false },
								areaStyles: {
									gradient: { on: true },
									borderLine: { on: true },
								},
							},
						]
					: []),
				...(percentageFields.length > 0
					? [
							{
								type: "line" as const,
								isSegmented: false,
								embeddedLabels: "none" as const,
								markers: { show: true },
								data: {
									valueFields: percentageFields.map((field) => ({
										color: SEARCH_CHART_COLORS[field.name],
										...field,
									})),
									valueGroup: "secondary" as const,
								},
								valueLabels: { on: false },
							},
						]
					: []),
			],
		},
	};
};

const createDesignerConfig = (visibleFields?: SearchMetricField[]): DesignerConfig => {
	const fields = getFields();
	const activeFields = visibleFields ? fields.filter((f) => visibleFields.includes(f.name)) : [...fields];
	const colors = activeFields.map((field) => SEARCH_CHART_COLORS[field.name]);
	const locale = LanguageService.currentUi();

	return {
		canvas: {
			axisLabel: { maxSize: { main: 80 } },
			legendBlock: { maxWidth: 200, static: { maxLinesAmount: 2 } },
			chartBlockMargin: { top: 0, right: 10, bottom: 0, left: 10 },
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
				return new Intl.NumberFormat(locale, {
					notation: "compact",
					maximumFractionDigits: 1,
				}).format(value);
			},
		},
	};
};

export const searchChartConfig = {
	get fields() {
		return getFields();
	},
	colors: SEARCH_CHART_COLORS,
	createChartConfig,
	createDesignerConfig,
	transformData: transformSearchData,
};
