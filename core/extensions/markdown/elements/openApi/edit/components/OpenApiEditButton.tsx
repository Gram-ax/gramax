import resolveModule from "@app/resolveModule/frontend";
import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FormStyle from "@components/Form/FormStyle";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import useLocalize from "../../../../../localization/useLocalize";
import getFocusNode from "../../../../elementsUtils/getFocusNode";

const FileInput = resolveModule("FileInput");

const OpenApiEditButton = ({ src, editor }: { src?: string; editor: Editor }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [content, setContent] = useState<string>(null);
	const [startContent, setStartContent] = useState<string>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const saveSrc = (newContent: string) => {
		if (!src) return;
		FetchService.fetch(apiUrlCreator.setArticleResource(src), newContent);
		editor.commands.updateAttributes(OPEN_API_NAME, { isUpdating: true });
	};

	const save = () => {
		saveSrc(content);
		setStartContent(content);
		setIsOpen(false);
	};

	const cancel = () => {
		setContent(startContent);
		setIsOpen(false);
	};

	const loadContent = async (src: string, apiUrlCreator: ApiUrlCreator) => {
		const res = await FetchService.fetch<string>(apiUrlCreator.getArticleResource(src), Fetcher.text);
		if (!res.ok) return;
		const content = await res.text();
		setContent(content);
		setStartContent(content);
	};

	useEffect(() => {
		if (src) loadContent(src, apiUrlCreator);
	}, [src, apiUrlCreator]);

	return (
		<ModalLayout
			contentWidth="L"
			isOpen={isOpen}
			onClose={cancel}
			onOpen={() => setIsOpen(true)}
			trigger={<Button icon={"pencil"} tooltipText={useLocalize("edit2")} />}
			onCmdEnter={save}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>OpenApi</legend>
						<FileInput language="yaml" value={content ?? ""} onChange={setContent} />
						<div className="buttons">
							<ButtonAtom buttonStyle={ButtonStyle.underline} onClick={cancel}>
								<span>{useLocalize("cancel")}</span>
							</ButtonAtom>
							<ButtonAtom buttonStyle={ButtonStyle.default} onClick={save}>
								<span>{useLocalize("save")}</span>
							</ButtonAtom>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
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
						tooltipText={flag ? useLocalize("schemasBlock") : useLocalize("noSchemasBlock")}
						onClick={toggleFlag}
					/>
				</ButtonsLayout>
				{node && <OpenApiEditButton editor={editor} src={node.attrs?.src} />}
				<Button icon="trash" tooltipText={useLocalize("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default OpenApiMenu;
