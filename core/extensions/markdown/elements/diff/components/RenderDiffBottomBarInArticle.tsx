import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import styled from "@emotion/styled";
import DiffBottomBar from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { ComponentProps } from "react";
import { createPortal } from "react-dom";

const DiffBottomBarWrapper = styled.div`
	position: absolute;
	width: 40vw;
	z-index: var(--z-index-diff-bottom-bar);
	bottom: 0;
`;

const RenderDiffBottomBarInArticle = (props: ComponentProps<typeof DiffBottomBar>) => {
	const articleRef = ArticleRefService.value;
	if (!articleRef?.current) return null;

	return createPortal(
		<DiffBottomBarWrapper>
			<DiffBottomBar {...props} />
		</DiffBottomBarWrapper>,
		articleRef.current,
	);
};

export default RenderDiffBottomBarInArticle;
