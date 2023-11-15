import Tooltip from "@components/Atoms/Tooltip";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useContext } from "react";
import useLocalize from "../../../../localization/useLocalize";
import { FocusPositionContext } from "../../../core/edit/components/ContextWrapper";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";
import Focus from "../../../elementsUtils/wrappers/Focus";

const EditBlock = ({ node, getPos }: NodeViewProps) => {
	const focusPosition = useContext(FocusPositionContext);
	return (
		<NodeViewWrapper as={"div"} contentEditable={false}>
			<Focus position={getPos()} isInline>
				<Tooltip
					visible={focusPosition == getPos()}
					content={
						<span>
							{useLocalize("toСhangeClick")}
							<em>{" " + useLocalize("editMarkdown") + " "}</em>
							{useLocalize("inTheRightPanel")}
						</span>
					}
				>
					<span data-focusable="true">{Renderer(node.attrs.tag, { components: getComponents() })}</span>
				</Tooltip>
			</Focus>
		</NodeViewWrapper>
	);
};

export default EditBlock;
