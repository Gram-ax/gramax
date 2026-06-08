/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import LanguageService from "@core-ui/ContextServices/Language";
import type { DateRange } from "react-day-picker";

export type DateType = string | number | Date;

export enum DatePreset {
	Today = "today",
	Week = "7-days",
	Month = "30-days",
	AllTime = "all-time",
}

export default abstract class DateUtils {
	static getDatePresets() {
		return Object.values(DatePreset);
	}

	static getDatePresetRange(preset: DatePreset) {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		if (preset === DatePreset.Today) {
			const to = new Date(now);
			to.setHours(23, 59, 59, 999);
			return { from: now, to };
		}
		if (preset === DatePreset.Week) {
			const from = new Date(now);
			from.setDate(from.getDate() - 6);
			const to = new Date(now);
			to.setHours(23, 59, 59, 999);
			return { from, to };
		}
		if (preset === DatePreset.Month) {
			const from = new Date(now);
			from.setDate(from.getDate() - 29);
			const to = new Date(now);
			to.setHours(23, 59, 59, 999);
			return { from, to };
		}
		return { from: null, to: null };
	}

	static detectPreset(range: DateRange) {
		if (!range?.from && !range?.to) return DatePreset.AllTime;
		if (!range?.from || !range?.to) return;
		const from = new Date(range.from);
		const to = new Date(range.to);
		from.setHours(0, 0, 0, 0);
		to.setHours(0, 0, 0, 0);
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
		const toIsToday = to.getTime() === now.getTime();
		if (toIsToday && from.getTime() === now.getTime()) return DatePreset.Today;
		if (toIsToday && diffDays === 6) return DatePreset.Week;
		if (toIsToday && diffDays === 29) return DatePreset.Month;
	}

	static getDateViewModel(date: DateType): string {
		const lang = LanguageService.currentUi();
		const dateObj = !(date instanceof Date) ? new Date(date) : date;
		return dateObj.toLocaleDateString(lang, {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
		});
	}

	static getRelativeDateTime(date: DateType) {
		const lang = LanguageService.currentUi();
		const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

		const dateObj = !(date instanceof Date) ? new Date(date) : date;
		if (dateObj.toString() === "Invalid Date") return "Invalid Date";

		const today = new Date();
		const diffMs = dateObj.getTime() - today.getTime();

		const diffSeconds = Math.round(diffMs / 1000);
		if (Math.abs(diffSeconds) < 60) {
			return rtf.format(diffSeconds, "second");
		}

		const diffMinutes = Math.round(diffMs / (1000 * 60));
		if (Math.abs(diffMinutes) < 60) {
			return rtf.format(diffMinutes, "minute");
		}

		const diffHours = Math.round(diffMs / (1000 * 60 * 60));
		if (Math.abs(diffHours) < 24) {
			return rtf.format(diffHours, "hour");
		}

		const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays > -30 && diffDays < 0) {
			return rtf.format(diffDays, "day");
		}

		const diffMonths = Math.round(diffDays / 30);
		if (diffMonths > -12 && diffMonths < 0) {
			return rtf.format(diffMonths, "month");
		}

		const diffYears = Math.round(diffDays / 365);
		if (diffYears < 0) {
			return rtf.format(diffYears, "year");
		}

		return new Intl.DateTimeFormat(lang).format(dateObj);
	}

	static sort(dateA: DateType, dateB: DateType) {
		if (dateA && dateB) {
			return new Date(dateB).getTime() - new Date(dateA).getTime();
		}

		if (!dateA && dateB) return 1;
		if (dateA && !dateB) return -1;

		return 0;
	}
}
