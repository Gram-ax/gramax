import InlineCommentView from "@ext/markdown/elements/comment/edit/components/View/InlineCommentView";
import EditMarkdown from "@ext/markdown/elements/md/component/EditMarkdown";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import getComponents from "../../../core/render/components/getComponents/getComponents";
import Renderer from "../../../core/render/components/Renderer";

const EditInline = ({ node, selected }: NodeViewProps) => {
	const commentId = node.attrs.comment?.id;
	return (
		<NodeViewWrapper as={"span"} contentEditable={false}>
			<InlineCommentView commentId={commentId}>
				<EditMarkdown visible={selected}>
					<div
						className="focus-pointer-events"
						data-focusable="true"
						style={{ display: "inline", borderRadius: "var(--radius-x-small)" }}
					>
						{Renderer(node.attrs.tag, { components: getComponents() })}
					</div>
				</EditMarkdown>
			</InlineCommentView>
		</NodeViewWrapper>
	);
};

export default EditInline;
