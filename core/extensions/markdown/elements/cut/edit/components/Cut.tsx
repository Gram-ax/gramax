import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Cut from "../../render/component/Cut";

const EditCut = ({ node, updateAttributes }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={node.attrs.isInline ? "span" : "div"}>
			<Cut
				text={node.attrs.text}
				expanded={node.attrs.expanded?.toString() === "true"}
				isInline={node.attrs.isInline}
				onUpdate={(expanded) => updateAttributes({ expanded })}
			>
				<NodeViewContent as={node.attrs.isInline ? "span" : "div"} className="content" />
			</Cut>
		</NodeViewWrapper>
	);
};
export default EditCut;
