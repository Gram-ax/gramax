import type UiLanguage from "@ext/localization/core/model/Language";
import { useSetting } from "@ext/settings/logic/hooks";
import type { CalendarProps as UiKitCalendarProps } from "ics-ui-kit/components/calendar";
import { Calendar as CalendarComponent } from "ics-ui-kit/components/calendar";
import { enUS } from "ics-ui-kit/vendors/date-fns/locale/en-US";
import { ru } from "ics-ui-kit/vendors/date-fns/locale/ru";

export const locales: Record<UiLanguage, typeof enUS | typeof ru> = {
	en: enUS,
	ru: ru,
};

export type CalendarProps = UiKitCalendarProps & { locale?: UiLanguage };

export const Calendar = (props: CalendarProps) => {
	const { locale, ...otherProps } = props;
	const [language] = useSetting("general.language");
	return <CalendarComponent {...(otherProps as UiKitCalendarProps)} locale={locales[locale || language]} />;
};
