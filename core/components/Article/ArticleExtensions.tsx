import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useToolbarViewport } from "@ext/markdown/core/edit/logic/Toolbar/useToolbarViewport";
import { useMediaQuery } from "@mui/material";

const ToolbarHeight = styled.div`
	height: var(--keyboard-height, 0px);
`;

const Wrapper = styled.div<{ bottom?: string }>`
	position: sticky;
	bottom: ${({ bottom }) => bottom || "4px"};
	z-index: var(--z-index-toolbar);
	pointer-events: none;

	${cssMedia.narrow} {
		bottom: 0;
	}
`;

const ArticleExtensions = ({ id, bottom }: { id: string; bottom?: string }) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const toolbarRef = useToolbarViewport();

	return (
		<>
			{isMobile && <ToolbarHeight />}
			<Wrapper bottom={bottom} ref={toolbarRef}>
				<div id={id} />
			</Wrapper>
		</>
	);
};

export default ArticleExtensions;
