import ActionButton from "@components/controls/HoverController/ActionButton";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

interface OpenApiActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	updateAttributes: (attrs: Record<string, unknown>) => void;
}

const OpenApiActions = ({ editor, node, getPos, updateAttributes }: OpenApiActionsProps) => {
	const { getBuffer } = OnLoadResourceService.value;

	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

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
			<ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />
		</>
	);
};

export default OpenApiActions;
