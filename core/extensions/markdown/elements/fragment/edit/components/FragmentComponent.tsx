import HoverableActions from "@components/controls/HoverController/HoverableActions";
import styled from "@emotion/styled";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import FragmentActions from "@ext/markdown/elements/fragment/edit/components/FragmentActions";
import FragmentUpdateService from "@ext/markdown/elements/fragment/edit/components/FragmentUpdateService";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import Fragment from "@ext/markdown/elements/fragment/render/components/Fragment";
import type { NodeViewProps } from "@tiptap/react";
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

const StyledBlockCommentView = styled(BlockCommentView)`
	margin: -4px -8px 0.2em -8px;
	padding: 4px 8px;
	padding-bottom: 0;
`;

const FragmentComponent = (props: NodeViewProps): ReactElement => {
	const { node } = props;
	const [content, setContent] = useState(node.attrs.content);
	const [isHovered, setIsHovered] = useState(false);
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const isExist = useMemo(() => node.attrs.id && node.attrs.title, [node.attrs.id, node.attrs.title]);

	useEffect(() => {
		FragmentUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => FragmentUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, [node.attrs.id]);

	const handleEdit = useCallback(() => {
		FragmentService.openItem({ id: node.attrs.id, title: node.attrs.title });
	}, [node.attrs.id, node.attrs.title]);

	return (
		<NodeViewContextableWrapper data-drag-handle draggable={true} props={props} ref={hoverElementRef}>
			<HoverableActions
				actionsOptions={{ comment: true }}
				hoverElementRef={hoverElementRef}
				isHovered={isHovered}
				rightActions={isExist ? <FragmentActions onClickEdit={handleEdit} /> : null}
				setIsHovered={setIsHovered}
			>
				<StyledBlockCommentView commentId={node.attrs.comment?.id}>
					<Fragment content={content} id={node.attrs.id} />
				</StyledBlockCommentView>
			</HoverableActions>
		</NodeViewContextableWrapper>
	);
};

export default FragmentComponent;
