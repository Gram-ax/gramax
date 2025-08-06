import EditMarkdown from "@ext/markdown/elements/md/component/EditMarkdown";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";
import styled from "@emotion/styled";

const ScrollableElement = styled.div`
	overflow-x: auto;
	overflow-y: hidden;
`;

const EditBlock = ({ node, selected }: NodeViewProps) => {
	return (
		<NodeViewWrapper as={"div"} contentEditable={false} data-focusable="true">
			<EditMarkdown visible={selected}>
				<ScrollableElement>
					<div className="focus-pointer-events">
						{Renderer(node.attrs.tag, { components: getComponents() })}
					</div>
				</ScrollableElement>
			</EditMarkdown>
		</NodeViewWrapper>
	);
};

export default EditBlock;
