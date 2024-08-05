import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";

const CodeBlockMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [isCoped, setIsCoped] = useState(false);
	const [params, setParams] = useState("");

	useEffect(() => {
		const { node: newNode } = getFocusNode(editor.state, (node) => node.type.name === "code_block");
		if (newNode) {
			if (!node || JSON.stringify(node.attrs) !== JSON.stringify(newNode.attrs)) {
				setNode(newNode);
				setParams(newNode.attrs?.params ?? "");
			}
		}
	}, [editor.state.selection]);

	if (!editor.isActive("code_block")) return null;

	const handleParamsChange = (e) => {
		setParams(e.target.value);
		editor.commands.updateAttributes("code_block", { params: e.target.value });
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(node.textContent);
		setIsCoped(true);
	};

	const handleMouseLeave = () => {
		setIsCoped(false);
	};

	const handleDelete = () => {
		editor.commands.deleteNode("code_block");
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("language")} value={params} onChange={handleParamsChange} />
				<div className="divider" />
				<ButtonsLayout>
					<Button
						icon="copy"
						tooltipText={isCoped ? t("copied") + "!" : t("copy")}
						onClick={handleCopy}
						onMouseLeave={handleMouseLeave}
					/>
					<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
				</ButtonsLayout>
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default CodeBlockMenu;
