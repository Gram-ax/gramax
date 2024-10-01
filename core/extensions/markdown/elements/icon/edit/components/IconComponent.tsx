import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { ReactElement } from "react";

const IconComponent = ({ node }: NodeViewProps): ReactElement => {
	const { code, svg, color } = node.attrs;

	return (
		<NodeViewWrapper as={"span"}>
			<span data-focusable="true" style={{ borderRadius: "var(--radius-small)" }}>
				<Icon {...{ code, svg, color }} />
			</span>
		</NodeViewWrapper>
	);
};

export default IconComponent;
