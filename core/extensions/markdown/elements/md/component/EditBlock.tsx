import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";

const EditBlock = ({ node, selected }: NodeViewProps) => {
	return (
		<NodeViewWrapper as={"div"} contentEditable={false} className="focus-pointer-events">
			<Tooltip
				visible={selected}
				content={
					<span>
						{t("to-сhange-click")}
						<em>{" " + t("article.edit-markdown") + " "}</em>
						{t("in-the-right-panel")}
					</span>
				}
			>
				<div data-focusable="true">{Renderer(node.attrs.tag, { components: getComponents() })}</div>
			</Tooltip>
		</NodeViewWrapper>
	);
};

export default EditBlock;
