import { TextSize } from "@components/Atoms/Button/Button";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import IsMacService from "@core-ui/ContextServices/IsMac";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import InboxTab from "@ext/inbox/components/InboxTab";
import { useMediaQuery } from "@mui/material";
import { useState } from "react";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import TopBarContent from "../../../ArticlePage/Bars/TopBarContent";
import BarLayout from "../../BarLayout";
import TemplateTab from "@ext/templates/components/Tab/TemplateTab";

const TopBarContentWrapper = styled.div<{ isMacDesktop: boolean }>`
	padding-top: ${(p) => (p.isMacDesktop ? "1.3rem" : "0")};
	width: 100%;
	gap: inherit;
	display: flex;
	align-items: center;
`;

const LeftNavigationTop = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const narrowMedia = useMediaQuery(cssMedia.narrow);
	const { isTauri } = usePlatform();
	const [currentTab, setCurrentTab] = useState<LeftNavigationTab>(LeftNavigationTab.None);

	const isMacDesktop = IsMacService.value && isTauri;

	const getPadding = () => {
		if (narrowMedia) return "0 14px";
		return leftNavIsOpen ? "0 14px" : "0 30px";
	};

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
						currentTab={currentTab}
						setCurrentTab={setCurrentTab}
						data={data}
					/>
				</TopBarContentWrapper>
			</BarLayout>
			<InboxTab show={currentTab === LeftNavigationTab.Inbox} />
			<TemplateTab show={currentTab === LeftNavigationTab.Template} />
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
