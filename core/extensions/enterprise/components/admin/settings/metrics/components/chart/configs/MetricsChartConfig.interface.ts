import type { DesignerConfig, MdtChartsConfig, MdtChartsDataSource } from "mdt-charts";

export type ChartValueField<TField extends string> = {
	name: TField;
	format: "integer" | "percent" | "string";
	title: string;
};

export interface MetricsChartConfig<TField extends string> {
	fields: ChartValueField<TField>[];
	colors: Record<TField, string>;
	createChartConfig: (width: number, visibleFields?: TField[]) => MdtChartsConfig;
	createDesignerConfig: (visibleFields?: TField[]) => DesignerConfig;
	transformData: (data: unknown[], labelFormat?: string) => MdtChartsDataSource;
}
