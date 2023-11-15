import Icon from "@components/Atoms/Icon";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import useLocalize from "../../localization/useLocalize";
import Theme from "../Theme";
import ThemeService from "./ThemeService";

const ThemeToggle = styled(({ className }: { className?: string }) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<div className={className} onClick={() => ThemeService.toggleTheme(apiUrlCreator)}>
			<a data-qa="app-action">
				<Icon
					code={theme == Theme.dark ? "moon" : "sun-bright"}
					style={{ fontSize: "12px", fontWeight: 300 }}
				/>
				<span>{useLocalize("theme")}</span>
			</a>
		</div>
	);
})`
	font-size: 11px;
`;

export default ThemeToggle;
