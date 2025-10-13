import CatalogActions from "@components/Actions/CatalogActions";
import { TextSize } from "@components/Atoms/Button/Button";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import Url from "@core-ui/ApiServices/Types/Url";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import Search from "../../Actions/Modal/Search";
import Link from "../../Atoms/Link";
import Logo from "../../Logo";
import InboxService from "@ext/inbox/components/InboxService";
import NotificationIcon from "@components/Layouts/LeftNavigationTabs/NotificationIcon";
import TemplateService from "@ext/templates/components/TemplateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import PromptService from "@ext/ai/components/Tab/PromptService";
import t from "@ext/localization/locale/translate";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";

interface TopBarContentProps {
	data: ArticlePageData;
	isMacDesktop: boolean;
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: LeftNavigationTab) => void;
	className?: string;
}

const TopBarContent = ({ data, isMacDesktop, currentTab, setCurrentTab, className }: TopBarContentProps) => {
	const { logo, cloudServiceUrl } = PageDataContextService.value.conf;
	const logoImageUrl = logo.imageUrl;
	const catalogProps = CatalogPropsService.value;
	const isCatalogExist = !!catalogProps.name;
	const { isStatic, isStaticCli } = usePlatform();
	const showHomePageButton = (!(isStatic || isStaticCli) || cloudServiceUrl) && !logoImageUrl;

	const { items: notes } = InboxService.value;
	const { templates } = TemplateService.value;
	const { snippets, selectedID } = SnippetService.value;
	const { items: promptNotes } = PromptService.value;
	const { articles } = FavoriteService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onCloseInbox = () => {
		InboxService.removeAllItems();
	};

	const onCloseTemplate = () => {
		TemplateService.closeItem();
		TemplateService.setItems([]);
	};

	const onCloseSnippet = async () => {
		await SnippetUpdateService.updateContent(selectedID, apiUrlCreator);
		SnippetService.closeItem();
		SnippetService.setItems([]);
	};

	const onClosePrompt = () => {
		PromptService.removeAllItems();
	};

	return (
		<div className={className}>
			{showHomePageButton && (
				<Link className="home" href={Url.fromRouter(useRouter(), { pathname: "/" })} dataQa="home-page-button">
					<ButtonLink textSize={TextSize.L} iconCode="grip" />
				</Link>
			)}
			<Logo imageUrl={logoImageUrl} />
			<div className="iconWrapper">
				{currentTab === LeftNavigationTab.Inbox && (
					<NotificationIcon
						iconCode="inbox"
						tooltipText={t("inbox.notes")}
						count={notes.length}
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onCloseInbox}
					/>
				)}
				{currentTab === LeftNavigationTab.FavoriteArticles && (
					<NotificationIcon
						iconCode="star"
						tooltipText={t("favorites-articles")}
						count={articles.length}
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
					/>
				)}
				{currentTab === LeftNavigationTab.Template && (
					<NotificationIcon
						count={templates.size}
						tooltipText={t("template.name")}
						iconCode="layout-template"
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onCloseTemplate}
					/>
				)}
				{currentTab === LeftNavigationTab.Snippets && (
					<NotificationIcon
						iconCode="file"
						count={snippets.size}
						tooltipText={t("snippets")}
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onCloseSnippet}
					/>
				)}
				{currentTab === LeftNavigationTab.Prompt && (
					<NotificationIcon
						iconCode="square-chevron-right"
						count={promptNotes.length}
						tooltipText={t("ai.ai-prompts")}
						isMacDesktop={isMacDesktop}
						setCurrentTab={setCurrentTab}
						onCloseNotification={onClosePrompt}
					/>
				)}
				<Search isHomePage={false} catalogLinks={[data.catalogProps.link]} itemLinks={data.itemLinks} />
				<CatalogActions
					isCatalogExist={isCatalogExist}
					itemLinks={data.itemLinks}
					currentTab={currentTab}
					setCurrentTab={setCurrentTab}
				/>
			</div>
		</div>
	);
};

export default styled(TopBarContent)`
	gap: 14px;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.home {
		display: flex;
	}

	.iconWrapper {
		display: flex;
		gap: 0.5em;
		align-items: center;
		vertical-align: middle;
	}
`;
