import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import DrawioEditButton from "@ext/markdown/elements/drawio/edit/components/DrawioEditButton";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, useEffect, useState } from "react";

const DrawioMenu = ({ editor }: { editor: Editor }) => {
	const [src, setSrc] = useState<string>(null);
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);
	const articleProps = ArticlePropsService.value;

	useEffect(() => {
		const { node, position } = getFocusNode(editor.state, (node) => node.type.name === "drawio");
		if (node) {
			setNode(node);
			setSrc(node?.attrs?.src ?? "");
			setTitle(node?.attrs?.title ?? "");
		}
		if (typeof position === "number") setPosition(position);
	}, [editor.state.selection]);

	if (!editor.isActive("drawio")) return null;

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleDelete = () => {
		if (node) {
			editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
		}
	};
	if (!src) return null;
	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("signature")} value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<DrawioEditButton logicPath={articleProps.logicPath} src={src} trigger />
				<Button icon={"trash"} tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default DrawioMenu;
