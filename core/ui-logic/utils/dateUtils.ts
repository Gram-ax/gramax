import LanguageService from "@core-ui/ContextServices/Language";

import dayjs from "dayjs";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default abstract class DateUtils {
	static getDateViewModel(date: string): string {
		dayjs.locale(LanguageService.currentUi());
		return dayjs(date).format("D MMM YYYY H:mm:ss");
	}

	static getRelativeDateTime(date: string, text = "") {
		dayjs.locale(LanguageService.currentUi());
		return `${dayjs(date).fromNow()}${text ? " " + text : ""}`;
	}
}
