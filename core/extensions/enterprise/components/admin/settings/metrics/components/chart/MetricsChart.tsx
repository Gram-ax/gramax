import {
	type AxisLabelFormat,
	StyledCheckboxField,
} from "@ext/enterprise/components/admin/settings/metrics/components/chart/chartUtils";
import type { MetricsChartConfig } from "@ext/enterprise/components/admin/settings/metrics/components/chart/configs/MetricsChartConfig.interface";
import t from "@ext/localization/locale/translate";
import { ToggleGroup, ToggleGroupItem } from "ics-ui-kit/components/toggle-group";
import { Chart, type MdtChartsDataSource } from "mdt-charts";
import "mdt-charts/lib/style/charts-main.css";

import { Divider } from "@ui-kit/Divider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChartResize } from "./useChartResize";

interface MetricsChartProps<TField extends string> {
	data: unknown[];
	config: MetricsChartConfig<TField>;
	visibleFields?: Record<TField, boolean>;
	onVisibleFieldsChange?: (visibleFields: Record<TField, boolean>) => void;
	axisLabelFormat?: AxisLabelFormat;
	onAxisLabelFormatChange?: (format: AxisLabelFormat) => void;
	legendItems?: Array<{
		color: string;
		label: string;
		shape?: "square" | "circle";
	}>;
	showFilters?: boolean;
	title?: string;
}

const MetricsChart = <TField extends string>({
	data,
	config,
	visibleFields,
	onVisibleFieldsChange,
	axisLabelFormat,
	onAxisLabelFormatChange,
	legendItems,
	title,
}: MetricsChartProps<TField>) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<Chart | null>(null);
	const [labelFormat, setLabelFormat] = useState<AxisLabelFormat>(axisLabelFormat || "daily");
	const initialHeightRef = useRef<number | null>(null);

	// Sync labelFormat with axisLabelFormat prop
	useEffect(() => {
		if (axisLabelFormat) {
			setLabelFormat(axisLabelFormat);
		}
	}, [axisLabelFormat]);

	const activeFields = useMemo<TField[]>(() => {
		if (!visibleFields) return [];
		return Object.entries(visibleFields)
			.filter(([_, visible]) => visible)
			.map(([field]) => field as TField);
	}, [visibleFields]);

	const transformedData = useMemo(() => {
		return config.transformData(data, labelFormat);
	}, [data, labelFormat, config]);

	const dataRef = useRef<MdtChartsDataSource>(transformedData);
	dataRef.current = transformedData;

	// biome-ignore lint/correctness/useExhaustiveDependencies: need ro rerender only when transformedData changes
	const renderChart = useCallback(() => {
		if (!containerRef.current) return;

		if (chartRef.current) {
			chartRef.current.destroy();
			chartRef.current = null;
		}

		if (activeFields.length === 0) return;

		const width = containerRef.current.offsetWidth;

		chartRef.current = new Chart(
			config.createChartConfig(width, activeFields),
			config.createDesignerConfig(activeFields),
			dataRef.current,
		);
		chartRef.current.render(containerRef.current);

		if (initialHeightRef.current === null && containerRef.current) {
			initialHeightRef.current = containerRef.current.offsetHeight;
		}
	}, [activeFields, config, transformedData]);

	useEffect(() => {
		renderChart();

		return () => {
			chartRef.current?.destroy();
			chartRef.current = null;
		};
	}, [renderChart]);

	useChartResize({ containerRef, onResize: renderChart });

	const toggleField = (field: TField) => {
		if (onVisibleFieldsChange && visibleFields) {
			onVisibleFieldsChange({
				...visibleFields,
				[field]: !visibleFields[field],
			});
		}
	};

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full border border-dashed rounded-md">
				<p className="text-muted">No data available</p>
			</div>
		);
	}

	return (
		<div className="border rounded-md p-6 w-full relative">
			<div className="flex justify-between items-start mb-4">
				<div>
					<h6 className="font-medium">{title}</h6>
					{axisLabelFormat && (
						<p className="text-sm text-muted mt-1">
							{axisLabelFormat === "daily" && t("metrics.chart.daily-breakdown")}
							{axisLabelFormat === "weekly" && t("metrics.chart.weekly-breakdown")}
							{axisLabelFormat === "monthly" && t("metrics.chart.monthly-breakdown")}
						</p>
					)}
				</div>

				{axisLabelFormat && onAxisLabelFormatChange && (
					<ToggleGroup
						className="gap-0 rounded-lg border border-secondary-border"
						onValueChange={onAxisLabelFormatChange}
						type="single"
						value={axisLabelFormat}
						variant="default"
					>
						<ToggleGroupItem className="rounded-none rounded-l-md" value="daily">
							{t("metrics.chart.daily")}
						</ToggleGroupItem>
						<Divider className="h-9" orientation="vertical" />
						<ToggleGroupItem className="rounded-none" value="weekly">
							{t("metrics.chart.weekly")}
						</ToggleGroupItem>
						<Divider className="h-9" orientation="vertical" />
						<ToggleGroupItem className="rounded-none  rounded-r-md" value="monthly">
							{t("metrics.chart.monthly")}
						</ToggleGroupItem>
					</ToggleGroup>
				)}
			</div>

			<div
				ref={containerRef}
				style={initialHeightRef.current ? { minHeight: `${initialHeightRef.current}px` } : undefined}
			/>

			{legendItems ? (
				<div className="flex flex-wrap gap-4 mt-4 justify-center">
					{legendItems.map((item) => (
						<div className="flex items-center gap-2" key={item.label}>
							<div
								className={item.shape === "circle" ? "w-3 h-3 rounded-full" : "w-3 h-3 rounded-sm"}
								style={{ backgroundColor: item.color }}
							/>
							<span className="text-sm">{item.label}</span>
						</div>
					))}
				</div>
			) : visibleFields && onVisibleFieldsChange ? (
				<div className="flex justify-center gap-8  mt-4">
					{config.fields.map((field) => {
						const isChecked = activeFields.includes(field.name);
						const color = config.colors[field.name];
						return (
							<StyledCheckboxField
								checked={isChecked}
								key={field.name}
								label={field.title}
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
			) : null}
		</div>
	);
};

export default MetricsChart;
