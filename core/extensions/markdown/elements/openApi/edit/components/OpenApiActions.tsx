import ActionButton from "@components/controls/HoverController/ActionButton";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

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

	const toggleInfo = () => {
		updateAttributes({ showInfo: !node.attrs.showInfo });
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
			<ActionButton dataTestId="edit-diagram" icon="pencil" onClick={openEditor} tooltipText={t("edit2")} />
			<ActionButton
				dataTestId="toggle-openapi-info"
				icon="heading"
				onClick={toggleInfo}
				selected={node.attrs.showInfo}
				tooltipText={t(node.attrs.showInfo ? "hide-openapi-info" : "show-openapi-info")}
			/>
			<ActionButton
				dataTestId="toggle-schemas-block"
				icon={node.attrs.flag ? "square-check" : "square"}
				onClick={toggleFlag}
				tooltipText={node.attrs.flag ? t("schemas-block") : t("no-schemas-block")}
			/>
		</>
	);
};

export default OpenApiActions;
