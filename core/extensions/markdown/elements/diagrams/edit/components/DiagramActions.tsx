import ActionButton from "@components/controls/HoverController/ActionButton";
import toggleSignature from "@core-ui/toggleSignature";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { Dispatch, RefObject, SetStateAction } from "react";

interface DiagramActionsProps {
	editor: Editor;
	node: Node;
	signatureRef: RefObject<HTMLInputElement>;
	openEditor: () => void;
	setHasSignature: Dispatch<SetStateAction<boolean>>;
}

const DiagramActions = ({ editor, node, setHasSignature, signatureRef, openEditor }: DiagramActionsProps) => {
	const updateAttributes = (attributes: Record<string, any>) => {
		editor.commands.updateAttributes(node.type, attributes);
	};

	const addSignature = () => {
		setHasSignature((prev) => toggleSignature(prev, signatureRef.current, updateAttributes));
	};

	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit2")} onClick={openEditor} />
			<ActionButton icon="captions" tooltipText={t("signature")} onClick={addSignature} />
		</>
	);
};

export default DiagramActions;
