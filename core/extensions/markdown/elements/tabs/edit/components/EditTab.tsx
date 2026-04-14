import Tab from "@ext/markdown/elements/tabs/render/component/Tab";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type { ReactElement } from "react";

const EditTab = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Tab idx={node.attrs.idx}>
				<NodeViewContent className="content" />
			</Tab>
		</NodeViewWrapper>
	);
};
export default EditTab;
