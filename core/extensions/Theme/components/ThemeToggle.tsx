import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import Theme from "../Theme";
import ThemeService from "./ThemeService";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

const ThemeToggle = ({ isHomePage, className }: { isHomePage?: boolean; className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return isHomePage ? (
		<Tooltip>
			<TooltipContent>{t("change-theme")}</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					size="lg"
					variant="ghost"
					iconClassName="h-5 w-5 stroke-[1.6]"
					className="p-2"
					icon={theme == Theme.dark ? "moon" : "sun"}
					onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
				/>
			</TooltipTrigger>
		</Tooltip>
	) : (
		<ButtonLink
			className={className}
			onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
			iconCode={theme == Theme.dark ? "moon" : "sun"}
			text={t("theme")}
		/>
	);
};

export default ThemeToggle;
