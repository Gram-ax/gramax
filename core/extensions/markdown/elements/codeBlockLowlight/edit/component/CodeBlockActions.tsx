import ActionButton from "@components/controls/HoverController/ActionButton";
import ActionSearcher from "@components/controls/HoverController/ActionSearcher";
import t from "@ext/localization/locale/translate";
import { Languages } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LangList";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { useState } from "react";

interface CodeBlockActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	updateAttributes: (attributes: Record<string, any>) => void;
}

const CodeBlockActions = ({ editor, node, getPos, updateAttributes }: CodeBlockActionsProps) => {
	const [isCopied, setIsCopied] = useState(false);

	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(node.textContent);
		setIsCopied(true);
	};

	const onMouseLeave = () => {
		setIsCopied(false);
	};

	const onChange = (lang: string) => {
		if (!lang) return updateAttributes({ language: "" });
		const Lang = Languages.find((i) => i.toLowerCase() === lang.toLowerCase());
		updateAttributes({ language: Lang });
	};

	return (
		<>
			<ActionSearcher
				placeholder={t("language.name")}
				items={Languages}
				onChange={onChange}
				defaultValue={node.attrs.language ?? ""}
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
