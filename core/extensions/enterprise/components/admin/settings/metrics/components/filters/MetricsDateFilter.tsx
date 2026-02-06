import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import { Calendar } from "@ui-kit/Calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import styled from "@emotion/styled";
import { enUS, ru } from "date-fns/locale";
import { type FC, useMemo, useState } from "react";
import { getDateRangeForInterval, type MetricsInterval, type PresetInterval } from "../../utils";

interface MetricsDateFilterProps {
	interval: MetricsInterval;
	disabled: boolean;
	dateRange: { startDate: string; endDate: string };
	onChange: (interval: MetricsInterval, startDate: string, endDate: string) => Promise<void>;
}

type PresetOption = {
	key: PresetInterval;
	label: string;
};

const presetOptions: PresetOption[] = [
	{ key: "day", label: t("metrics.filters.date.today") },
	{ key: "yesterday", label: t("metrics.filters.date.yesterday") },
	{ key: "thisWeek", label: t("metrics.filters.date.this-week") },
	{ key: "week", label: t("metrics.filters.date.last-7-days") },
	{ key: "last28Days", label: t("metrics.filters.date.last-28-days") },
	{ key: "month", label: t("metrics.filters.date.this-month") },
	{ key: "lastMonth", label: t("metrics.filters.date.last-month") },
	{ key: "year", label: t("metrics.filters.date.this-year") },
];

const StyledDropdownMenuTriggerButton = styled(DropdownMenuTriggerButton)`
	&&,
	&&:hover,
	&&:active,
	&&:focus,
	&&[data-state="open"] {
		background-color: var(--color-black);
		color: var(--color-white);
	}
`;

const MetricsDateFilter: FC<MetricsDateFilterProps> = ({ interval, disabled, dateRange, onChange }) => {
	const [isOpen, setIsOpen] = useState(false);

	const language = LanguageService.currentUi();
	const calendarLocale = language === "ru" ? ru : enUS;

	const currentDateRange = useMemo(
		() => ({
			from: new Date(dateRange.startDate),
			to: dayjs(dateRange.endDate).subtract(1, "day").toDate(),
		}),
		[dateRange.startDate, dateRange.endDate],
	);

	const handlePresetClick = async (preset: PresetInterval) => {
		const { startDate, endDate } = getDateRangeForInterval(preset);
		await onChange(preset, startDate, endDate);
	};

	const handleCalendarChange = async (range: { from: Date; to: Date } | undefined) => {
		if (range?.from && range?.to) {
			const startDate = dayjs(range.from).format("YYYY-MM-DD");
			const endDate = dayjs(range.to).add(1, "day").format("YYYY-MM-DD");
			await onChange("custom", startDate, endDate);
		}
	};

	const getDisplayValue = () => {
		const formatter = new Intl.DateTimeFormat(language, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		return formatter.formatRange(currentDateRange.from, currentDateRange.to);
	};

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<StyledDropdownMenuTriggerButton disabled={disabled} variant="outline">
					<Icon icon="calendar" />
					{getDisplayValue()}
				</StyledDropdownMenuTriggerButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-0">
				<div className="flex">
					<div className="flex flex-col border-r min-w-[150px]">
						{presetOptions.map((preset) => (
							<button
								className={`px-4 py-2 text-left text-sm hover:bg-secondary-bg-hover transition-colors ${
									interval === preset.key ? "bg-primary-bg-hover font-medium" : ""
								}`}
								key={preset.key}
								onClick={() => handlePresetClick(preset.key)}
								type="button"
							>
								{preset.label}
							</button>
						))}
					</div>
					<div>
						<Calendar
							className="rounded-md border-0"
							disabled={{ after: new Date() }}
							locale={calendarLocale}
							mode="range"
							onSelect={handleCalendarChange}
							selected={currentDateRange}
						/>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default MetricsDateFilter;
