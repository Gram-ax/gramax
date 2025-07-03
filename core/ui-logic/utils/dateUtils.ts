import LanguageService from "@core-ui/ContextServices/Language";

export type DateType = string | number | Date;

export default abstract class DateUtils {
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
