import ActionButton from "@components/controls/HoverController/ActionButton";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

interface OpenApiActionsProps {
	editor: Editor;
	node: Node;
	updateAttributes: (attrs: Record<string, unknown>) => void;
}

const OpenApiActions = ({ editor, node, updateAttributes }: OpenApiActionsProps) => {
	const { getBuffer } = ResourceService.value;

	const toggleFlag = () => {
		updateAttributes({ flag: !node.attrs.flag });
	};

	const openEditor = () => {
		const src = node.attrs.src;
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: getBuffer(src).toString(),
			src,
			diagramName: "OpenApi",
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<>
			<ActionButton icon="pencil" onClick={openEditor} tooltipText={t("edit2")} />
			<ActionButton
				icon={node.attrs.flag ? "square-check" : "square"}
				onClick={toggleFlag}
				tooltipText={node.attrs.flag ? t("schemas-block") : t("no-schemas-block")}
			/>
		</>
	);
};

export default OpenApiActions;
