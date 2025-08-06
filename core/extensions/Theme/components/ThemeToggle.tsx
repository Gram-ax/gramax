import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import Theme from "../Theme";
import ThemeService from "./ThemeService";

const ThemeToggle = ({ isHomePage, className }: { isHomePage?: boolean; className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return isHomePage ? (
		<IconButton
			variant="ghost"
			icon={theme == Theme.dark ? "moon" : "sun"}
			onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
		/>
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
