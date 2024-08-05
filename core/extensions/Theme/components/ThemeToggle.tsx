import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import Theme from "../Theme";
import ThemeService from "./ThemeService";

const ThemeToggle = ({ className }: { className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<ButtonLink
			className={className}
			onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
			iconCode={theme == Theme.dark ? "moon" : "sun"}
			text={t("theme")}
		/>
	);
};

export default ThemeToggle;
