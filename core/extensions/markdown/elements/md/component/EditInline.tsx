import EditMarkdown from "@ext/markdown/elements/md/component/EditMarkdown";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";
import InlineCommentView from "@ext/markdown/elements/comment/edit/components/InlineCommentView";

const EditInline = ({ node, selected }: NodeViewProps) => {
	const commentId = node.attrs.comment?.id;
	return (
		<NodeViewWrapper as={"span"} contentEditable={false}>
			<InlineCommentView commentId={commentId}>
				<EditMarkdown visible={selected}>
					<div
						style={{ display: "inline", borderRadius: "var(--radius-x-small)" }}
						data-focusable="true"
						className="focus-pointer-events"
					>
						{Renderer(node.attrs.tag, { components: getComponents() })}
					</div>
				</EditMarkdown>
			</InlineCommentView>
		</NodeViewWrapper>
	);
};

export default EditInline;
