import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useContext } from "react";
import { FocusPositionContext } from "../../../core/edit/components/ContextWrapper";
import Renderer from "../../../core/render/components/Renderer";
import getComponents from "../../../core/render/components/getComponents/getComponents";
import Focus from "../../../elementsUtils/wrappers/Focus";

const EditInline = ({ node, getPos }: NodeViewProps) => {
	const focusPosition = useContext(FocusPositionContext);
	return (
		<NodeViewWrapper as={"span"} contentEditable={false}>
			<Focus getPos={getPos} isMd>
				<Tooltip
					visible={focusPosition == getPos()}
					content={
						<span>
							{t("to-сhange-click")}
							<em>{" " + t("article.edit-markdown") + " "}</em>
							{t("in-the-right-panel")}
						</span>
					}
				>
					<div style={{ display: "inline", borderRadius: "var(--radius-x-small)" }} data-focusable="true">
						{Renderer(node.attrs.tag, { components: getComponents() })}
					</div>
				</Tooltip>
			</Focus>
		</NodeViewWrapper>
	);
};

export default EditInline;
