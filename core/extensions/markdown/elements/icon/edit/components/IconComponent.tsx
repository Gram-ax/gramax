import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import Focus from "@ext/markdown/elementsUtils/wrappers/Focus";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { ReactElement } from "react";

const IconComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	const { code, svg, color } = node.attrs;

	return (
		<NodeViewWrapper as={"span"}>
			<Focus getPos={getPos} isMd>
				<span data-focusable="true" style={{ borderRadius: "var(--radius-small)" }}>
					<Icon {...{ code, svg, color }} />
				</span>
			</Focus>
		</NodeViewWrapper>
	);
};

export default IconComponent;
