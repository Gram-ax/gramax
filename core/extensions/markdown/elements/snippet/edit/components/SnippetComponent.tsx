import HoverableActions from "@components/controls/HoverController/HoverableActions";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import SnippetActions from "@ext/markdown/elements/snippet/edit/components/SnippetActions";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import Snippet from "@ext/markdown/elements/snippet/render/components/Snippet";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import styled from "@emotion/styled";

const StyledBlockCommentView = styled(BlockCommentView)`
	margin: -4px -8px 0.2em -8px;
	padding: 4px 8px;
	padding-bottom: 0;
`;

const SnippetComponent = (props: NodeViewProps): ReactElement => {
	const { node } = props;
	const [content, setContent] = useState(node.attrs.content);
	const [isHovered, setIsHovered] = useState(false);
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const isExist = useMemo(() => node.attrs.id && node.attrs.title, [node.attrs.id, node.attrs.title]);

	useEffect(() => {
		SnippetUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => SnippetUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, []);

	const handleEdit = useCallback(() => {
		SnippetService.openItem({ id: node.attrs.id, title: node.attrs.title });
	}, [node.attrs.id, node.attrs.title]);

	const contents = useMemo(() => Renderer(content, { components: getComponents() }), [content]);

	return (
		<NodeViewContextableWrapper ref={hoverElementRef} props={props} draggable={true} data-drag-handle>
			<HoverableActions
				hoverElementRef={hoverElementRef}
				setIsHovered={setIsHovered}
				isHovered={isHovered}
				actionsOptions={{ comment: true }}
				rightActions={isExist ? <SnippetActions onClickEdit={handleEdit} /> : null}
			>
				<StyledBlockCommentView commentId={node.attrs.comment?.id}>
					<Snippet id={node.attrs.id}>{contents}</Snippet>
				</StyledBlockCommentView>
			</HoverableActions>
		</NodeViewContextableWrapper>
	);
};

export default SnippetComponent;
