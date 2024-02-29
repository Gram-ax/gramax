import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
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
		const isLogged = PageDataContextService.value.isLogged;
		const isServerApp = PageDataContextService.value.conf.isServerApp;

		return (
			<div className={className} data-qa="app-actions">
				{isHomePage ? <Search isHomePage={isHomePage} catalogLinks={catalogLinks} /> : null}
				{/* <LangToggle /> */}
				<ThemeToggle />
				{isHomePage && isLogged && <AddCatalogMenu />}
				{isServerApp && <SingInOut />}
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
