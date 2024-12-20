import { getExecutingEnvironment } from "@app/resolveModule/env";
import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import IsMacService from "@core-ui/ContextServices/IsMac";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import TopBarContent from "../../../ArticlePage/Bars/TopBarContent";
import BarLayout from "../../BarLayout";

const TopBarContentWrapper = styled.div<{ isMacDesktop: boolean }>`
	padding-top: ${(p) => (p.isMacDesktop ? "1.3rem" : "0")};
	width: 100%;
	gap: inherit;
`;

const LeftNavigationTop = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const narrowMedia = useMediaQuery(cssMedia.narrow);

	const isMacDesktop = IsMacService.value && getExecutingEnvironment() == "tauri";

	const getPadding = () => {
		if (narrowMedia) return "0 14px";
		return leftNavIsOpen ? "0 14px" : "0 30px";
	};

	return (
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
				<TopBarContent data={data} />
			</TopBarContentWrapper>
		</BarLayout>
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
