import EditMarkdown from "@ext/markdown/elements/md/edit/component/EditMarkdown";
import RenderBlock from "@ext/markdown/elements/md/render/RenderBlock";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const EditBlock = ({ node, selected }: NodeViewProps) => {
	return (
		<NodeViewWrapper as={"div"} contentEditable={false} data-focusable="true">
			<EditMarkdown visible={selected}>
				<RenderBlock tag={node.attrs.tag} />
			</EditMarkdown>
		</NodeViewWrapper>
	);
};

export default EditBlock;
