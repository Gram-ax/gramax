import InlineCommentView from "@ext/markdown/elements/comment/edit/components/InlineCommentView";
import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { ReactElement } from "react";

const IconComponent = ({ node }: NodeViewProps): ReactElement => {
	const { code, svg, color } = node.attrs;
	const commentId = node.attrs.comment?.id;

	return (
		<NodeViewWrapper as={"span"}>
			<InlineCommentView commentId={commentId}>
				<span data-focusable="true" style={{ borderRadius: "var(--radius-small)" }}>
					<Icon {...{ code, svg, color }} />
				</span>
			</InlineCommentView>
		</NodeViewWrapper>
	);
};

export default IconComponent;
