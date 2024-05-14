import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState, ChangeEvent } from "react";

const CutMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [text, setText] = useState("");
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		const { node: newNode } = getFocusNode(
			editor.state,
			(node) => node.type.name === "cut" || node.type.name === "inlineCut_component",
		);
		if (!node || (newNode && JSON.stringify(node?.attrs) !== JSON.stringify(newNode?.attrs))) {
			setNode(newNode);
			setText(newNode?.attrs?.text ?? "");
			setExpanded(newNode?.attrs?.expanded?.toString() === "true");
		}
	}, [editor.state.selection]);

	if (!(editor.isActive("cut") || editor.isActive("inlineCut_component"))) return null;

	const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
		setText(e.target.value);
		editor.commands.updateAttributes(node.type, { text: e.target.value });
	};

	const toggleExpanded = () => {
		setExpanded(!expanded);
		if (node) editor.commands.updateAttributes(node.type, { expanded: !expanded });
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Текст" value={text} onChange={handleTextChange} />
				<div className="divider" />
				<ButtonsLayout>
					<Button
						icon={expanded ? "square" : "square-check"}
						tooltipText={`Выводить первоначально ${expanded ? "развернуто" : "свернуто"}`}
						onClick={toggleExpanded}
					/>
				</ButtonsLayout>
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default CutMenu;
