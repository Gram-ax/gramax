import { topMenuItemClassName } from "@components/HomePage/TopMenu";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import Theme from "../Theme";
import ThemeService from "./ThemeService";

const ThemeToggle = ({ isHomePage, className }: { isHomePage?: boolean; className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return isHomePage ? (
		<Tooltip>
			<TooltipContent>{t("change-theme")}</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className={classNames("p-2", {}, [topMenuItemClassName])}
					data-testid="switch-theme"
					icon={theme === Theme.dark ? "moon" : "sun"}
					iconClassName="h-5 w-5 stroke-[1.6]"
					onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
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
			onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
			text={t("theme")}
		/>
	);
};

export default ThemeToggle;
