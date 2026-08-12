import { topMenuItemClassName } from "@components/HomePage/TopMenu/const";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import { useSetting } from "@ext/settings/logic/hooks";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import Theme from "../Theme";

const ThemeToggle = ({ isHomePage, className }: { isHomePage?: boolean; className?: string }) => {
	const [theme, setTheme] = useSetting("general.theme");

	const toggle = () => {
		setTheme(theme === Theme.dark ? Theme.light : Theme.dark);
	};

	return isHomePage ? (
		<Tooltip>
			<TooltipContent>{t("change-theme")}</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className={classNames("p-2", {}, [topMenuItemClassName])}
					data-testid="switch-theme"
					icon={theme === Theme.dark ? "moon" : "sun"}
					iconClassName="h-5 w-5 stroke-[1.6]"
					onClick={toggle}
					size="lg"
					variant="ghost"
				/>
			</TooltipTrigger>
		</Tooltip>
	) : (
		<ButtonLink
			className={className}
			data-testid="switch-theme"
			iconCode={theme === Theme.dark ? "moon" : "sun"}
			onClick={toggle}
			text={t("theme.title")}
		/>
	);
};

export default ThemeToggle;
