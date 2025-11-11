import InlineCommentView from "@ext/markdown/elements/comment/edit/components/InlineCommentView";
import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { memo, ReactElement } from "react";

const IconMemoized = memo(
	({ code, svg, color, commentId }: { code: string; svg: string; color: string; commentId: string }) => {
		return (
			<InlineCommentView commentId={commentId}>
				<span data-focusable="true" style={{ borderRadius: "var(--radius-small)" }}>
					<Icon {...{ code, svg, color }} />
				</span>
			</InlineCommentView>
		);
	},
);

const IconComponent = ({ node }: NodeViewProps): ReactElement => {
	const { code, svg, color } = node.attrs;
	const commentId = node.attrs.comment?.id;

	return (
		<NodeViewWrapper as={"span"}>
			<IconMemoized code={code} svg={svg} color={color} commentId={commentId} />
		</NodeViewWrapper>
	);
};

export default IconComponent;
