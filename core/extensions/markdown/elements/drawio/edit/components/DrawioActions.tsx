import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { RefObject } from "react";

interface DrawioActionsProps {
	editor: Editor;
	node: Node;
	signatureRef: RefObject<HTMLInputElement>;
	openEditor: () => void;
	getPos: () => number;
	setHasSignature: (value: boolean) => void;
}

const DrawioActions = ({ editor, node, getPos, setHasSignature, signatureRef, openEditor }: DrawioActionsProps) => {
	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const addSignature = () => {
		setHasSignature(true);
		signatureRef.current?.focus();
	};

	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit2")} onClick={openEditor} />
			<ActionButton icon="a-large-small" tooltipText={t("signature")} onClick={addSignature} />
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
		</>
	);
};

export default DrawioActions;
