import ActionButton from "@components/controls/HoverController/ActionButton";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import toggleSignature from "@core-ui/toggleSignature";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { Dispatch, RefObject, SetStateAction } from "react";

interface DrawioActionsProps {
	editor: Editor;
	node: Node;
	signatureRef: RefObject<HTMLInputElement>;
	openEditor: () => void;
	setHasSignature: Dispatch<SetStateAction<boolean>>;
}

const DrawioActions = ({ editor, node, setHasSignature, signatureRef, openEditor }: DrawioActionsProps) => {
	const disabledEdit = !PageDataContextService.value.conf.diagramsServiceUrl;
	const updateAttributes = (attributes: Record<string, string>) => {
		editor.commands.updateAttributes(node.type, attributes);
	};

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

export default DrawioActions;
