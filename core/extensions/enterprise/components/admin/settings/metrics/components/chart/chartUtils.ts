import LanguageService from "@core-ui/ContextServices/Language";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import styled from "@emotion/styled";
import { CheckboxField } from "@ui-kit/Checkbox";

export type AxisLabelFormat = "daily" | "weekly" | "monthly";

const MIN_PIXELS_PER_LABEL = 45;
const MIN_PIXELS_PER_LABEL_WEEKLY = 30;

export const AXIS_DATE_FORMATS: Record<AxisLabelFormat, string> = {
	daily: "DD.MM",
	weekly: "MMM DD",
	monthly: "MMM YYYY",
};

export const getOptimalAxisFormat = (dataLength: number, containerWidth: number): AxisLabelFormat => {
	const pixelsPerLabel = containerWidth / dataLength;
	if (pixelsPerLabel >= MIN_PIXELS_PER_LABEL) return "daily";
	if (pixelsPerLabel >= MIN_PIXELS_PER_LABEL_WEEKLY) return "weekly";
	return "monthly";
};

export const formatDateForAxis = (date: string, format: AxisLabelFormat): string => {
	const locale = LanguageService.currentUi();
	return dayjs(date).locale(locale).format(AXIS_DATE_FORMATS[format]);
};

export const aggregateByPeriod = <T extends { date: string }>(
	dataSet: T[],
	periodUnit: "week" | "month",
	aggregateFn: (existing: T, point: T) => void,
): T[] => {
	const periodMap = new Map<string, T>();

	for (const point of dataSet) {
		const periodKey = dayjs(point.date).startOf(periodUnit).format("YYYY-MM-DD");
		const existing = periodMap.get(periodKey);

		if (existing) {
			aggregateFn(existing, point);
		} else {
			periodMap.set(periodKey, { ...point });
		}
	}

	return Array.from(periodMap.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const StyledCheckboxField = styled(CheckboxField)`
	button {
	height:14px;
	width:14px;
	}
	`;
