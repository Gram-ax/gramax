import { getChartColors } from "@ext/enterprise/components/admin/settings/metrics/utils";
import t from "@ext/localization/locale/translate";
import LanguageService from "@core-ui/ContextServices/Language";
import { DesignerConfig, MdtChartsConfig } from "mdt-charts";

const CHART_HEIGHT = 300;

export const VALUE_FIELD_NAMES = ["visitors", "visits", "views"] as const;

export type MetricField = (typeof VALUE_FIELD_NAMES)[number];

export const getValueFields = () => [
	{ name: "visitors" as const, format: "integer" as const, title: t("metrics.chart.visitors") },
	{ name: "visits" as const, format: "integer" as const, title: t("metrics.chart.visits") },
	{ name: "views" as const, format: "integer" as const, title: t("metrics.chart.views") },
];

export const createChartConfig = (width: number, visibleFields?: MetricField[]): MdtChartsConfig => {
	const allFields = getValueFields();
	const fields = visibleFields ? allFields.filter((f) => visibleFields.includes(f.name)) : [...allFields];

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
					data: { valueFields: [...fields] },
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

export const createDesignerConfig = (visibleFields?: MetricField[]): DesignerConfig => {
	const allFields = getValueFields();
	const fields = visibleFields ? allFields.filter((f) => visibleFields.includes(f.name)) : [...allFields];
	const chartColors = getChartColors();
	const colors = fields.map((field) => chartColors[field.name]);

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
				return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
			},
		},
	};
};
