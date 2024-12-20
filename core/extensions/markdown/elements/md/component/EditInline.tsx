import EditMarkdown from "@ext/markdown/elements/md/component/EditMarkdown";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";

const EditInline = ({ node, selected }: NodeViewProps) => {
	return (
		<NodeViewWrapper as={"span"} contentEditable={false} className="focus-pointer-events">
			<EditMarkdown visible={selected}>
				<div style={{ display: "inline", borderRadius: "var(--radius-x-small)" }} data-focusable="true">
					{Renderer(node.attrs.tag, { components: getComponents() })}
				</div>
			</EditMarkdown>
		</NodeViewWrapper>
	);
};

export default EditInline;
