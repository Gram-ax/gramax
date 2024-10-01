import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";
import getFocusNode from "../../../../elementsUtils/getFocusNode";

const OpenApiEditButton = ({ src, editor }: { src?: string; editor: Editor }) => {
	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: OnLoadResourceService.getBuffer(src).toString(),
			src,
			diagramName: "OpenApi",
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return <Button icon={"pencil"} onClick={openEditor} tooltipText={t("edit2")} />;
};

const OpenApiMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [flag, setFlag] = useState(false);
	const [position, setPosition] = useState(0);

	useEffect(() => {
		const { node: focusNode, position: focusPosition } = getFocusNode(
			editor.state,
			(node) => node.type.name === OPEN_API_NAME,
		);
		if (focusNode) {
			setNode(focusNode);
			setFlag(focusNode.attrs.flag);
		}
		if (typeof focusPosition === "number") setPosition(focusPosition);
	}, [editor.state.selection]);

	if (!editor.isActive(OPEN_API_NAME)) return null;

	const handleDelete = () => {
		if (!node) return;
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const toggleFlag = () => {
		setFlag(!flag);
		if (node) editor.commands.updateAttributes(node.type, { flag: !flag });
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<ButtonsLayout>
					<Button
						icon={flag ? "square-check" : "square"}
						tooltipText={flag ? t("schemas-block") : t("no-schemas-block")}
						onClick={toggleFlag}
					/>
				</ButtonsLayout>
				{node && <OpenApiEditButton editor={editor} src={node.attrs?.src} />}
				<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default OpenApiMenu;
