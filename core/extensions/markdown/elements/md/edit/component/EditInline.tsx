import InlineCommentView from "@ext/markdown/elements/comment/edit/components/View/InlineCommentView";
import EditMarkdown from "@ext/markdown/elements/md/edit/component/EditMarkdown";
import RenderInline from "@ext/markdown/elements/md/render/RenderInline";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const EditInline = ({ node, selected }: NodeViewProps) => {
	const commentId = node.attrs.comment?.id;
	return (
		<NodeViewWrapper as={"span"} contentEditable={false}>
			<InlineCommentView commentId={commentId}>
				<EditMarkdown visible={selected}>
					<RenderInline tag={node.attrs.tag} />
				</EditMarkdown>
			</InlineCommentView>
		</NodeViewWrapper>
	);
};

export default EditInline;
