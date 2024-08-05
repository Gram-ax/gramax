import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import LogsLayout from "@components/Layouts/LogsLayout";
import Modal from "@components/Layouts/Modal";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Base64ToDataImage, DataImageToBase64, isDataImage } from "@core-ui/Base64Converter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import DiagramEditor from "../../logic/diagram-editor";
import getDrawioID from "../logic/getDrawioID";

const DrawioEditButton = ({ src }: { src: string }) => {
	const [isLoading, setIsLoading] = useState(false);
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const getImgTag = useCallback(
		() => (document.getElementById(getDrawioID(src, articleProps.logicPath)) ?? {}) as HTMLImageElement,
		[src, articleProps.logicPath],
	);

	const setImgData = useCallback(() => {
		const imagData = getImgTag().src;
		if (!isDataImage(imagData)) {
			getImgTag().src = Base64ToDataImage(OnLoadResourceService.getBuffer(src).toString("base64"));
		}
	}, [src, getImgTag]);

	const saveCallBack = useCallback(async () => {
		setImgData();
		const imagData = getImgTag().src;
		const newBase64Img = DataImageToBase64(imagData);
		const buffer = Buffer.from(newBase64Img, "base64");
		await FetchService.fetch(apiUrlCreator.setArticleResource(src), buffer);
		OnLoadResourceService.update(src, buffer);
	}, [src, getImgTag, setImgData, apiUrlCreator]);

	OnLoadResourceService.useGetContent(
		src,
		apiUrlCreator,
		useCallback(() => setImgData(), [setImgData]),
	);

	return (
		<>
			<Modal isOpen={isLoading}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</Modal>
			<Button
				icon={"pencil"}
				tooltipText={t("edit2")}
				onClick={useCallback(() => {
					ArticleUpdaterService.stopLoadingAfterFocus();
					setImgData();
					setIsLoading(true);
					const de = DiagramEditor.editElement(
						getImgTag(),
						saveCallBack,
						() => setIsLoading(false),
						null,
						"modern",
						null,
						["splash=0", `lang=${LanguageService.currentUi()}`, "pv=0"],
					);
					window.history.pushState({}, document.location.href, "");
					window.addEventListener("popstate", () => de.stopEditing(), { once: true });
				}, [setImgData, getImgTag])}
			/>
		</>
	);
};

const DrawioMenu = ({ editor }: { editor: Editor }) => {
	const [src, setSrc] = useState<string>(null);
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

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
				<DrawioEditButton src={src} />
				<Button icon={"trash"} tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default DrawioMenu;
