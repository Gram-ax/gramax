import Language, { defaultLanguage } from "../../extensions/localization/core/model/Language";

import dayjs from "dayjs";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default abstract class DateUtils {
	static getDateViewModel(date: string, lang: Language = defaultLanguage): string {
		dayjs.locale(lang);
		return dayjs(date).format("D MMM YYYY H:mm:ss");
	}

	static getRelativeDateTime(date: string, lang: Language = defaultLanguage, text = "") {
		dayjs.locale(lang);
		return `${dayjs(date).fromNow()}${text ? " " + text : ""}`;
	}
}
