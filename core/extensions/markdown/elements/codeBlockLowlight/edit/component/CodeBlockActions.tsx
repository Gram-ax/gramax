import ActionButton from "@components/controls/HoverController/ActionButton";
import ActionSearcher from "@components/controls/HoverController/ActionSearcher";
import t from "@ext/localization/locale/translate";
import {
	StandardCaseLangList,
	getStandardCaseByLower,
} from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { Node } from "@tiptap/pm/model";
import { useState } from "react";

interface CodeBlockActionsProps {
	node: Node;
	onChange: (lang: string) => void;
}

const CodeBlockActions = ({ node, onChange }: CodeBlockActionsProps) => {
	const [isCopied, setIsCopied] = useState(false);

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
		</>
	);
};

export default CodeBlockActions;
