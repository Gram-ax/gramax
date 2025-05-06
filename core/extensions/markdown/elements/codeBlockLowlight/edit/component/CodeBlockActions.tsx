import ActionButton from "@components/controls/HoverController/ActionButton";
import ActionSearcher from "@components/controls/HoverController/ActionSearcher";
import t from "@ext/localization/locale/translate";
import {
	StandardCaseLangList,
	getStandardCaseByLower,
} from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { useState } from "react";

interface CodeBlockActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	onChange: (lang: string) => void;
}

const CodeBlockActions = ({ editor, node, getPos, onChange }: CodeBlockActionsProps) => {
	const [isCopied, setIsCopied] = useState(false);

	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const handleCopy = () => {
		void navigator.clipboard.writeText(node.textContent);
		setIsCopied(true);
	};

	const onMouseLeave = () => {
		setIsCopied(false);
	};

	return (
		<>
			<ActionSearcher
				placeholder={t("language.name")}
				items={StandardCaseLangList}
				onChange={onChange}
				defaultValue={getStandardCaseByLower(node.attrs.language) || ""}
			/>
			<ActionButton
				icon={isCopied ? "check" : "copy"}
				tooltipText={t("copy")}
				onClick={handleCopy}
				onMouseLeave={onMouseLeave}
			/>
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
		</>
	);
};

export default CodeBlockActions;
