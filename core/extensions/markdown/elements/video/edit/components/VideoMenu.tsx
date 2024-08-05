import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import debounceFunction from "@core-ui/debounceFunction";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, useEffect, useState } from "react";

const PATH_UPDATE_SYMBOL = Symbol();

const VideoMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [path, setPath] = useState("");
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

	useEffect(() => {
		const { node, position } = getFocusNode(editor.state, (node) => node.type.name === "video");
		if (node) {
			setNode(node);
			setPath(node.attrs?.path);
			setTitle(node.attrs?.title);
		}
		if (typeof position === "number") setPosition(position);
	}, [editor.state.selection]);

	if (!editor.isActive("video")) return null;

	const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPath(e.target.value);
		debounceFunction(
			PATH_UPDATE_SYMBOL,
			() => {
				editor.commands.updateAttributes(node.type, { path: e.target.value });
			},
			1000,
		);
	};

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleDelete = () => {
		if (node) {
			editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("editor.video.link")} value={path} onChange={handlePathChange} />
				<div className="divider" />
				<Input placeholder={t("signature")} value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Button icon={"trash"} tooltipText={t("signature")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default VideoMenu;
