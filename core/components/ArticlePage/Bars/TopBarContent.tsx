import CatalogActions from "@components/Actions/CatalogActions/CatalogActions";
import { TextSize } from "@components/Atoms/Button/Button";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import NotificationIcon from "@components/Layouts/LeftNavigationTabs/NotificationIcon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import PromptService from "@ext/ai/components/Tab/PromptService";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import InboxService from "@ext/inbox/components/InboxService";
import t from "@ext/localization/locale/translate";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import TemplateService from "@ext/templates/components/TemplateService";
import { useEffect } from "react";
import Search from "../../../extensions/serach/components/Search";
import Link from "../../Atoms/Link";
import Logo from "../../Logo";

interface TopBarContentProps {
	data: ArticlePageData;
	isMacDesktop: boolean;
	currentTab: LeftNavigationTab;
	className?: string;
}

const TopBarContent = ({ data, isMacDesktop, currentTab, className }: TopBarContentProps) => {
	const { logo, cloudServiceUrl } = PageDataContextService.value.conf;
	const logoImageUrl = logo.imageUrl;
	const catalogName = useCatalogPropsStore((state) => state.data.name);
	const isCatalogExist = !!catalogName;
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

	useEffect(() => {
		NavigationTabsService.setTop(LeftNavigationTab.None);
	}, [catalogName]);

	return (
		<div className={className} key={catalogName}>
			{showHomePageButton && (
				<Link className="home" dataQa="home-page-button" href={Url.fromRouter(useRouter(), { pathname: "/" })}>
					<ButtonLink iconCode="grip" textSize={TextSize.L} />
				</Link>
			)}
			<Logo imageUrl={logoImageUrl} />
			<div className="iconWrapper">
				{currentTab === LeftNavigationTab.Inbox && (
					<NotificationIcon
						count={notes.length}
						iconCode="inbox"
						isMacDesktop={isMacDesktop}
						onCloseNotification={onCloseInbox}
						tooltipText={t("inbox.notes")}
					/>
				)}
				{currentTab === LeftNavigationTab.FavoriteArticles && (
					<NotificationIcon
						count={articles.length}
						iconCode="star"
						isMacDesktop={isMacDesktop}
						tooltipText={t("favorites-articles")}
					/>
				)}
				{currentTab === LeftNavigationTab.Template && (
					<NotificationIcon
						count={templates.size}
						iconCode="layout-template"
						isMacDesktop={isMacDesktop}
						onCloseNotification={onCloseTemplate}
						tooltipText={t("template.name")}
					/>
				)}
				{currentTab === LeftNavigationTab.Snippets && (
					<NotificationIcon
						count={snippets.size}
						iconCode="file"
						isMacDesktop={isMacDesktop}
						onCloseNotification={onCloseSnippet}
						tooltipText={t("snippets")}
					/>
				)}
				{currentTab === LeftNavigationTab.Prompt && (
					<NotificationIcon
						count={promptNotes.length}
						iconCode="square-chevron-right"
						isMacDesktop={isMacDesktop}
						onCloseNotification={onClosePrompt}
						tooltipText={t("ai.ai-prompts")}
					/>
				)}
				<Search isHomePage={false} />
				<CatalogActions currentTab={currentTab} isCatalogExist={isCatalogExist} itemLinks={data.itemLinks} />
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

	${cssMedia.narrow} {
		.iconWrapper > * {
			margin: -0.25em;
			padding: 0.25em;
		}
	}
`;
