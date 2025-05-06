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
	getPos: () => number;
	setHasSignature: Dispatch<SetStateAction<boolean>>;
}

const DiagramActions = ({ editor, node, getPos, setHasSignature, signatureRef, openEditor }: DiagramActionsProps) => {
	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

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
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
		</>
	);
};

export default DiagramActions;
