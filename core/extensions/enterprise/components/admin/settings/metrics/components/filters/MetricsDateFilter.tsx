import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import { Calendar } from "@ui-kit/Calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { enUS, ru } from "date-fns/locale";
import { FC, useMemo, useState } from "react";
import { getDateRangeForInterval, MetricsInterval, PresetInterval } from "../../utils";

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

const MetricsDateFilter: FC<MetricsDateFilterProps> = ({ interval, disabled, dateRange, onChange }) => {
	const [isOpen, setIsOpen] = useState(false);

	const language = LanguageService.currentUi();
	const calendarLocale = language === "ru" ? ru : enUS;

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
		if (interval === "custom") {
			return `${dayjs(currentDateRange.from).locale(language).format("MMM D")} - ${dayjs(currentDateRange.to)
				.locale(language)
				.format("MMM D, YYYY")}`;
		}
		const preset = presetOptions.find((p) => p.key === interval);
		return preset?.label || t("metrics.filters.date.today");
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<DropdownMenuTriggerButton variant="outline" disabled={disabled} className="min-w-[200px]">
					{getDisplayValue()}
				</DropdownMenuTriggerButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-0">
				<div className="flex">
					<div className="flex flex-col border-r min-w-[150px]">
						{presetOptions.map((preset) => (
							<button
								key={preset.key}
								onClick={() => handlePresetClick(preset.key)}
								className={`px-4 py-2 text-left text-sm hover:bg-secondary-bg-hover transition-colors ${
									interval === preset.key ? "bg-primary-bg-hover font-medium" : ""
								}`}
							>
								{preset.label}
							</button>
						))}
					</div>
					<div>
						<Calendar
							mode="range"
							locale={calendarLocale}
							selected={currentDateRange}
							onSelect={handleCalendarChange}
							className="rounded-md border-0"
							disabled={{ after: new Date() }}
						/>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default MetricsDateFilter;
