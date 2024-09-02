import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import HasWorkspaceHOC from "@core-ui/HigherOrderComponent/HasWorkspaceHOC";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import SwitchContentLanguage from "@ext/localization/actions/SwitchContentLanguage";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import SwitchTabsTag from "@ext/markdown/elements/tabs/components/SwitchTabsTag";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import ThemeToggle from "../extensions/Theme/components/ThemeToggle";
import AddCatalogMenu from "../extensions/catalog/actions/AddCatalogMenu";
import Search from "./Actions/Modal/Search";
import SingInOut from "./Actions/SingInOut";

export default styled(
	({
		catalogLinks = [],
		isHomePage = false,
		className,
	}: {
		catalogLinks?: CatalogLink[];
		isHomePage?: boolean;
		className?: string;
	}) => {
		const pageProps = PageDataContextService.value;
		const isServerApp = PageDataContextService.value.conf.isServerApp;

		return (
			<div className={className} data-qa="app-actions">
				{isHomePage && !isServerApp && WorkspaceService.hasActive() && <SwitchWorkspace />}
				<HasWorkspaceHOC>
					{isHomePage && <Search isHomePage={isHomePage} catalogLinks={catalogLinks} />}
				</HasWorkspaceHOC>
				{pageProps.isArticle ? <SwitchContentLanguage /> : <SwitchUiLanguage />}
				<ThemeToggle />
				<HasWorkspaceHOC>
					{isHomePage && pageProps?.isLogged && <AddCatalogMenu />}
					{<SingInOut />}
					{!isHomePage && <SwitchTabsTag />}
				</HasWorkspaceHOC>
			</div>
		);
	},
)`
	display: flex;
	align-items: center;
	flex-direction: row;
	gap: var(--distance-actions);
	justify-content: space-between;

	${(p) => (p.isHomePage ? `${cssMedia.narrow}{ i + span { display: none }}` : "")}
`;
