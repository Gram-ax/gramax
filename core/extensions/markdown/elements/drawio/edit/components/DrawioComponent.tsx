import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useCallback, useRef, useState } from "react";
import Drawio from "../../render/component/Drawio";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import BlockActionPanel from "@components/BlockActionPanel";
import DrawioActions from "@ext/markdown/elements/drawio/edit/components/DrawioActions";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { Base64ToDataImage, DataImageToBase64, isDataImage } from "@core-ui/Base64Converter";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import DiagramEditor from "@ext/markdown/elements/drawio/logic/diagram-editor";
import LanguageService from "@core-ui/ContextServices/Language";

const DrawioComponent = ({ node, getPos, editor }: NodeViewProps): ReactElement => {
	const isEditable = editor.isEditable;
	const nodeSrc: string = node.attrs.src;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const refT = useRef<HTMLImageElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs.title?.length > 0);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const { getBuffer, update } = OnLoadResourceService.value;

	const setImgData = useCallback(() => {
		const imagData = refT.current?.src;
		if (!isDataImage(imagData)) {
			refT.current.src = Base64ToDataImage(getBuffer(nodeSrc)?.toString("base64"));
		}
	}, [nodeSrc, refT, getBuffer]);

	const saveCallBack = useCallback(
		async (data: string) => {
			const newBase64Img = DataImageToBase64(data);
			const buffer = Buffer.from(newBase64Img, "base64");
			await FetchService.fetch(apiUrlCreator.setArticleResource(nodeSrc), buffer);
			update(nodeSrc, buffer);
			updateAttributes({});
		},
		[nodeSrc, apiUrlCreator],
	);

	const openEditor = useCallback(() => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
		ArticleUpdaterService.stopLoadingAfterFocus();
		setImgData();
		const de = DiagramEditor.editElement(
			pageDataContext.conf.diagramsServiceUrl,
			refT.current,
			saveCallBack,
			() => ModalToOpenService.resetValue(),
			null,
			"modern",
			null,
			["splash=0", `lang=${LanguageService.currentUi()}`, "pv=0"],
		);
		window.history.pushState({}, document.location.href, "");
		window.addEventListener(
			"popstate",
			() => {
				de.stopEditing();
			},
			{ once: true },
		);
	}, [pageDataContext, refT.current, saveCallBack, setImgData]);

	const updateAttributes = useCallback(
		async (attributes: Record<string, any>) => {
			const pos = getPos();
			if (!pos) return;
			const tr = editor.view.state.tr;
			const url = apiUrlCreator.getArticleResource(node.attrs.src);
			const res = await FetchService.fetch(url);
			if (res.ok) {
				const buffer = await res.buffer();
				const urlToImage = URL.createObjectURL(new Blob([buffer], { type: resolveImageKind(buffer) }));
				const newSize = await getNaturalSize(urlToImage);
				if (newSize) {
					attributes.width = newSize.width + "px";
					attributes.height = newSize.height + "px";
				}
				URL.revokeObjectURL(urlToImage);
			}

			Object.keys(attributes).forEach((key) => {
				tr.setNodeAttribute(pos, key, attributes[key]);
			});

			editor.view.dispatch(tr);
		},
		[editor, getPos, node, apiUrlCreator],
	);

	return (
		<NodeViewWrapper ref={hoverElement} as={"div"} draggable={true} data-drag-handle data-qa="qa-drawio">
			<BlockActionPanel
				isSignature={hasSignature}
				hoverElementRef={hoverElement}
				updateAttributes={updateAttributes}
				signatureText={node.attrs.title}
				signatureRef={signatureRef}
				getPos={getPos}
				hasSignature={hasSignature}
				setHasSignature={setHasSignature}
				rightActions={
					isEditable && (
						<DrawioActions
							openEditor={openEditor}
							editor={editor}
							node={node}
							getPos={getPos}
							setHasSignature={setHasSignature}
							signatureRef={signatureRef}
						/>
					)
				}
			>
				<Drawio
					noEm={isEditable}
					ref={refT}
					id={getDrawioID(nodeSrc, articleProps.logicPath)}
					width={node.attrs.width}
					height={node.attrs.height}
					openEditor={openEditor}
					src={nodeSrc}
					title={node.attrs.title}
				/>
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};

export default DrawioComponent;
