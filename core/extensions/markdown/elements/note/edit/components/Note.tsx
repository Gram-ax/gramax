import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Note from "../../render/component/Note";

const EditNote = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Note type={node.attrs.type} title={node.attrs.title}>
				<NodeViewContent className="content" />
			</Note>
		</NodeViewWrapper>
	);
};
export default EditNote;
