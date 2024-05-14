import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Theme from "../Theme";
import ThemeService from "./ThemeService";
import useLocalize from "@ext/localization/useLocalize";

const ThemeToggle = ({ className }: { className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<ButtonLink
			className={className}
			onClick={() => ThemeService.toggleTheme(apiUrlCreator)}
			iconCode={theme == Theme.dark ? "moon" : "sun"}
			text={useLocalize("theme")}
		/>
	);
};

export default ThemeToggle;
