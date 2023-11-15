import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import FetchService from "@core-ui/ApiServices/FetchService";
import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import { Base64ToDataImage, DataImageToBase64 } from "@core-ui/Base64Converter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState, ChangeEvent } from "react";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import DiagramEditor from "../../logic/diagram-editor";
import getDrawioID from "../logic/getDrawioID";

const DrawioEditButton = ({ src }: { src: string }) => {
	const [base64Img, setBase64Img] = useState(null);
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadContent = async (src: string, apiUrlCreator: ApiUrlCreator) => {
		const res = await FetchService.fetch<string>(apiUrlCreator.getArticleResource(src), Fetcher.text);
		if (!res.ok) return;
		const content = await res.text();
		const loadBase64Img = window.btoa(window.unescape(window.encodeURIComponent(content)));
		setBase64Img(loadBase64Img);
		getImgTag().src = Base64ToDataImage(loadBase64Img);
	};

	useEffect(() => {
		if (!src) return;
		loadContent(src, apiUrlCreator);
	}, [src, apiUrlCreator]);

	const getImgTag = () => (document.getElementById(getDrawioID(src, articleProps.path)) ?? {}) as HTMLImageElement;

	const saveCallBack = () => {
		const newBase64Img = DataImageToBase64(getImgTag().src);
		if (base64Img == newBase64Img) return;
		FetchService.fetch(apiUrlCreator.setArticleResource(src, true), newBase64Img);
	};

	return (
		<Button
			icon={"pen"}
			tooltipText={"Редактировать"}
			onClick={() => {
				ArticleUpdaterService.stopLoadingAfterFocus();
				const diagramEditor = DiagramEditor.editElement(getImgTag(), saveCallBack);
				window.history.pushState({}, document.location.href, "");
				window.addEventListener("popstate", () => diagramEditor.stopEditing(), { once: true });
			}}
		/>
	);
};

const DrawioMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

	useEffect(() => {
		const { node, position } = getFocusNode(editor.state, (node) => node.type.name === "drawio");
		if (node) {
			setNode(node);
			setTitle(node?.attrs?.title ?? "");
		}
		if (position) setPosition(position);
	}, [editor.state.selection]);

	if (!editor.isActive("drawio")) return null;

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleDelete = () => {
		if (position !== null && node) {
			editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Подпись" value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<DrawioEditButton src={node?.attrs?.src} />
				<Button icon={"trash"} tooltipText={"Удалить"} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default DrawioMenu;
