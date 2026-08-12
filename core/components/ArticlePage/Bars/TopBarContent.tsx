import CatalogActions from "@components/Actions/CatalogActions/CatalogActions";
import { TextSize } from "@components/Atoms/Button/Button";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import NotificationIcon from "@components/Layouts/LeftNavigationTabs/NotificationIcon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useItemLinks } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
// biome-ignore lint/style/noRestrictedImports: out of scope
import styled from "@emotion/styled";
import AgentNotificationIcon from "@ext/agent/components/skills/AgentNotificationIcon";
import { promptStore, usePromptStore } from "@ext/ai/components/Tab/PromptStore";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import InboxService from "@ext/inbox/components/InboxService";
import t from "@ext/localization/locale/translate";
import FragmentUpdateService from "@ext/markdown/elements/fragment/edit/components/FragmentUpdateService";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import TemplateService from "@ext/templates/components/TemplateService";
import { useEffect } from "react";
import Search from "../../../extensions/serach/components/Search";
import Link from "../../Atoms/Link";
import Logo from "../../Logo";

interface TopBarContentProps {
	isMacDesktop: boolean;
	currentTab: LeftNavigationTab;
	className?: string;
}

const TopBarContent = ({ isMacDesktop, currentTab, className }: TopBarContentProps) => {
	const { logo, cloudServiceUrl } = PageDataContextService.value.conf;
	const logoImageUrl = logo.imageUrl;
	const catalogName = useCatalogPropsStore((state) => state.data.name);
	const itemLinks = useItemLinks();
	const isCatalogExist = !!catalogName;
	const { isStatic, isStaticCli } = usePlatform();
	const showHomePageButton = (!(isStatic || isStaticCli) || cloudServiceUrl) && !logoImageUrl;

	const { items: notes } = InboxService.value;
	const { templates } = TemplateService.value;
	const { fragments, selectedID } = FragmentService.value;
	const promptNotes = usePromptStore((s) => s.items);
	const { articles } = FavoriteService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onCloseInbox = () => {
		InboxService.removeAllItems();
	};

	const onCloseTemplate = () => {
		TemplateService.closeItem();
		TemplateService.setItems([]);
	};

	const onCloseFragment = async () => {
		await FragmentUpdateService.updateContent(selectedID, apiUrlCreator);
		FragmentService.closeItem();
		FragmentService.setItems([]);
	};

	const onClosePrompt = () => {
		promptStore.getState().removeAllItems();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: catalogName is required to reset
	useEffect(() => {
		NavigationTabsService.setTop(LeftNavigationTab.None);
	}, [catalogName]);

	return (
		<div className={className} data-testid="left-navigation-top" key={catalogName}>
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
						tooltipText={t("inbox.name")}
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
				{currentTab === LeftNavigationTab.Fragments && (
					<NotificationIcon
						count={fragments.size}
						iconCode="square-dashed-bottom"
						isMacDesktop={isMacDesktop}
						onCloseNotification={onCloseFragment}
						tooltipText={t("fragments")}
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
				{currentTab === LeftNavigationTab.AgentSkills && <AgentNotificationIcon isMacDesktop={isMacDesktop} />}
				<Search isHomePage={false} itemLinks={itemLinks} />
				<CatalogActions currentTab={currentTab} isCatalogExist={isCatalogExist} itemLinks={itemLinks} />
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
