import ActionButton from "@components/controls/HoverController/ActionButton";
import DiagramType from "@core/components/Diagram/DiagramType";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import toggleSignature from "@core-ui/toggleSignature";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { Dispatch, RefObject, SetStateAction } from "react";

interface DiagramActionsProps {
	editor: Editor;
	node: Node;
	signatureRef: RefObject<HTMLInputElement>;
	openEditor: () => void;
	setHasSignature: Dispatch<SetStateAction<boolean>>;
}

const DiagramActions = ({ editor, node, setHasSignature, signatureRef, openEditor }: DiagramActionsProps) => {
	const updateAttributes = (attributes: Record<string, string>) => {
		editor.commands.updateAttributes(node.type, attributes);
	};
	const diagramName = node.attrs.diagramName;
	const disabledEdit =
		!PageDataContextService.value.conf.diagramsServiceUrl && diagramName === DiagramType["plant-uml"];

	const addSignature = () => {
		setHasSignature((prev) => toggleSignature(prev, signatureRef.current, updateAttributes));
	};

	return (
		<>
			<ActionButton
				disabled={disabledEdit}
				icon="pencil"
				onClick={openEditor}
				tooltipText={disabledEdit ? t("diagram.error.no-diagram-renderer") : t("edit2")}
			/>
			<ActionButton icon="captions" onClick={addSignature} tooltipText={t("signature")} />
		</>
	);
};

export default DiagramActions;
