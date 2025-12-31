import { MetricsFilters, VisibleMetrics } from "@ext/enterprise/components/admin/settings/metrics/useMetricsFilters";
import t from "@ext/localization/locale/translate";
import { CheckboxField } from "@ui-kit/Checkbox";
import { ToggleGroup, ToggleGroupItem } from "ics-ui-kit/components/toggle-group";
import { Chart, MdtChartsDataSource } from "mdt-charts";
import "mdt-charts/lib/style/charts-main.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartDataPoint } from "../../types";
import { getChartColors } from "../../utils";
import { createChartConfig, createDesignerConfig, getValueFields, MetricField } from "./MetricsChartConfig";
import { useChartResize } from "./useChartResize";
import { AxisLabelFormat, getAxisLabelFormat, transformDataForChart } from "./utils";

interface MetricsChartProps {
	data: ChartDataPoint[];
	visibleMetrics: VisibleMetrics;
	onVisibleMetricsChange: (visibleMetrics: VisibleMetrics) => void;
	axisLabelFormat: MetricsFilters["axisLabelFormat"];
	onAxisLabelFormatChange: (format: MetricsFilters["axisLabelFormat"]) => void;
}

const MetricsChart = ({
	data,
	visibleMetrics,
	onVisibleMetricsChange,
	axisLabelFormat,
	onAxisLabelFormatChange,
}: MetricsChartProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<Chart | null>(null);
	const [labelFormat, setLabelFormat] = useState<AxisLabelFormat>("daily");
	const [optimalFormat, setOptimalFormat] = useState<AxisLabelFormat>("daily");
	const initialHeightRef = useRef<number | null>(null);
	const userPreferredFormat = useRef<"daily" | "weekly" | "monthly">(axisLabelFormat);
	const lastChangeWasManual = useRef(false);

	const visibleFields = useMemo<MetricField[]>(() => {
		const fields: MetricField[] = [];
		if (visibleMetrics.views) fields.push("views");
		if (visibleMetrics.visits) fields.push("visits");
		if (visibleMetrics.visitors) fields.push("visitors");
		return fields;
	}, [visibleMetrics]);

	const transformedData = useMemo(() => transformDataForChart(data, labelFormat), [data, labelFormat]);
	const dataRef = useRef<MdtChartsDataSource>(transformedData);
	dataRef.current = transformedData;

	const renderChart = useCallback(() => {
		if (!containerRef.current) return;

		if (chartRef.current) {
			chartRef.current.destroy();
			chartRef.current = null;
		}

		if (visibleFields.length === 0) return;

		const width = containerRef.current.offsetWidth;

		const calculatedOptimalFormat = getAxisLabelFormat(data.length, width);
		setOptimalFormat(calculatedOptimalFormat);

		const formatHierarchy: AxisLabelFormat[] = ["daily", "weekly", "monthly"];
		const preferredIndex = formatHierarchy.indexOf(userPreferredFormat.current);
		const optimalIndex = formatHierarchy.indexOf(calculatedOptimalFormat);

		const targetFormat = optimalIndex <= preferredIndex ? userPreferredFormat.current : calculatedOptimalFormat;

		if (targetFormat !== axisLabelFormat) {
			lastChangeWasManual.current = false;
			onAxisLabelFormatChange(targetFormat);
			setLabelFormat(targetFormat);
		} else {
			setLabelFormat(axisLabelFormat);
		}

		chartRef.current = new Chart(
			createChartConfig(width, visibleFields),
			createDesignerConfig(visibleFields),
			dataRef.current,
		);
		chartRef.current.render(containerRef.current);

		if (initialHeightRef.current === null && containerRef.current) {
			initialHeightRef.current = containerRef.current.offsetHeight;
		}
	}, [visibleFields, data.length, axisLabelFormat, onAxisLabelFormatChange]);

	useEffect(() => {
		renderChart();

		return () => {
			chartRef.current?.destroy();
			chartRef.current = null;
		};
	}, [transformedData, renderChart]);

	useChartResize({ containerRef, onResize: renderChart });

	const toggleField = (field: MetricField) => {
		onVisibleMetricsChange({
			...visibleMetrics,
			[field]: !visibleMetrics[field],
		});
	};

	const chartColors = getChartColors();

	return (
		<div className="border rounded-md pb-4 w-full relative">
			<div className="flex justify-end p-2">
				<ToggleGroup
					type="single"
					value={axisLabelFormat}
					onValueChange={(value) => {
						if (value) {
							const newFormat = value as "daily" | "weekly" | "monthly";
							userPreferredFormat.current = newFormat;
							lastChangeWasManual.current = true;
							onAxisLabelFormatChange(newFormat);
						}
					}}
				>
					<ToggleGroupItem value="daily" disabled={optimalFormat === "weekly" || optimalFormat === "monthly"}>
						{t("metrics.chart.daily")}
					</ToggleGroupItem>
					<ToggleGroupItem value="weekly" disabled={optimalFormat === "monthly"}>
						{t("metrics.chart.weekly")}
					</ToggleGroupItem>
					<ToggleGroupItem value="monthly">{t("metrics.chart.monthly")}</ToggleGroupItem>
				</ToggleGroup>
			</div>

			<div
				ref={containerRef}
				style={initialHeightRef.current ? { minHeight: `${initialHeightRef.current}px` } : undefined}
			/>

			<div className="flex justify-center gap-4 mt-3">
				{getValueFields().map((field) => {
					const isChecked = visibleFields.includes(field.name);
					const color = chartColors[field.name];
					return (
						<CheckboxField
							key={field.name}
							label={field.title}
							checked={isChecked}
							onCheckedChange={() => toggleField(field.name)}
							style={
								isChecked
									? {
											backgroundColor: color,
											borderColor: color,
									  }
									: undefined
							}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default MetricsChart;
