import EditMarkdown from "@ext/markdown/elements/md/component/EditMarkdown";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";

const EditBlock = ({ node, selected }: NodeViewProps) => {
	return (
		<NodeViewWrapper as={"div"} contentEditable={false} className="focus-pointer-events">
			<EditMarkdown visible={selected}>
				<div data-focusable="true">{Renderer(node.attrs.tag, { components: getComponents() })}</div>
			</EditMarkdown>
		</NodeViewWrapper>
	);
};

export default EditBlock;
