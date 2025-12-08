import { TextSize } from "@components/Atoms/Button/Button";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import IsMacService from "@core-ui/ContextServices/IsMac";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import PromptTab from "@ext/ai/components/Tab/PromptTab";
import FavoriteArticlesTab from "@ext/article/Favorite/components/FavoriteArticlesTab";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import InboxTab from "@ext/inbox/components/InboxTab";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import SnippetsTab from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetsTab";
import TemplateTab from "@ext/templates/components/Tab/TemplateTab";
import TemplateService from "@ext/templates/components/TemplateService";
import { useMediaQuery } from "@react-hook/media-query";
import { useEffect } from "react";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import TopBarContent from "../../../ArticlePage/Bars/TopBarContent";
import BarLayout from "../../BarLayout";

const TopBarContentWrapper = styled.div<{ isMacDesktop: boolean }>`
	padding-top: ${(p) => (p.isMacDesktop ? "1.3rem" : "0")};
	width: 100%;
	gap: inherit;
	display: flex;
	align-items: center;
`;

const LeftNavigationTop = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const catalogNotFound = useCatalogPropsStore((state) => state.data.notFound);
	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const { isTauri, isBrowser, isStaticCli } = usePlatform();
	const { topTab } = NavigationTabsService.value;

	const isMacDesktop = IsMacService.value && isTauri;

	const getPadding = () => {
		if (narrowMedia) return "0 14px";
		return leftNavIsOpen ? "0 14px" : "0 30px";
	};

	useEffect(() => {
		const onBranchChange = (_, caller: any) => {
			NavigationTabsService.setTop(LeftNavigationTab.None);
			if (caller === OnBranchUpdateCaller.Init) return;
			[SnippetService, TemplateService].forEach((context) => context.closeItem());
		};

		BranchUpdaterService.addListener(onBranchChange);

		return () => {
			BranchUpdaterService.removeListener(onBranchChange);
		};
	}, []);

	return (
		<>
			<BarLayout
				className={className}
				padding={getPadding()}
				gap={narrowMedia ? "14px" : 0}
				height={isMacDesktop ? null : "var(--top-bar-height)"}
			>
				<TopBarContentWrapper isMacDesktop={isMacDesktop}>
					{narrowMedia && (
						<ButtonLink
							textSize={TextSize.L}
							iconCode={leftNavIsOpen ? "arrow-left-from-line" : "arrow-right-from-line"}
							onClick={() => {
								SidebarsIsOpenService.value = { left: !leftNavIsOpen };
							}}
						/>
					)}
					<TopBarContent
						isMacDesktop={isMacDesktop}
						currentTab={topTab}
						setCurrentTab={(tab) => NavigationTabsService.setTop(tab)}
						data={data}
					/>
				</TopBarContentWrapper>
			</BarLayout>
			{(isTauri || isBrowser) && !catalogNotFound && (
				<>
					<InboxTab show={topTab === LeftNavigationTab.Inbox} />
					<TemplateTab show={topTab === LeftNavigationTab.Template} />
					<SnippetsTab show={topTab === LeftNavigationTab.Snippets} />
					<PromptTab show={topTab === LeftNavigationTab.Prompt} />
				</>
			)}
			{!isStaticCli && !catalogNotFound && (
				<FavoriteArticlesTab show={topTab === LeftNavigationTab.FavoriteArticles} />
			)}
		</>
	);
};

export default styled(LeftNavigationTop)`
	i {
		width: 1em !important;
	}

	${cssMedia.narrow} {
		border-bottom: 0.5px var(--color-line) solid;
	}
`;
