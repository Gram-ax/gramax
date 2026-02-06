import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import BlockActionPanel from "@components/BlockActionPanel";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Base64ToDataImage, DataImageToBase64, isDataImage } from "@core-ui/Base64Converter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import LanguageService from "@core-ui/ContextServices/Language";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import DrawioActions from "@ext/markdown/elements/drawio/edit/components/DrawioActions";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import DiagramEditor from "@ext/markdown/elements/drawio/logic/diagram-editor";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useCallback, useRef, useState } from "react";
import Drawio from "../../render/component/Drawio";

const DrawioComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes } = props;
	const isEditable = editor.isEditable;
	const nodeSrc: string = node.attrs.src;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const refT = useRef<HTMLImageElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs.title?.length > 0);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const { getBuffer, setResource } = ResourceService.value;

	const setImgData = useCallback(() => {
		const imagData = refT.current?.src;
		if (!isDataImage(imagData)) {
			const buffer = getBuffer(nodeSrc);
			if (!buffer || !buffer.byteLength || !refT.current) return;
			refT.current.src = Base64ToDataImage(buffer.toString("base64"));
		}
	}, [nodeSrc, getBuffer]);

	const saveCallBack = useCallback(
		async (data: string) => {
			const newBase64Img = DataImageToBase64(data);
			const buffer = Buffer.from(newBase64Img, "base64");
			await setResource(nodeSrc, buffer, undefined, true);
			updateAttributes({});
		},
		[nodeSrc, setResource],
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

	const updateAttributesCallback = useCallback(
		async (attributes: Record<string, any>) => {
			const pos = getPos();
			if (!pos) return;

			const url = apiUrlCreator.getArticleResource(node.attrs.src);
			const res = await FetchService.fetch(url);
			if (res.ok) {
				const buffer = await res.buffer();
				const urlToImage = URL.createObjectURL(new Blob([buffer], { type: resolveFileKind(buffer) }));
				const newSize = await getNaturalSize(urlToImage);
				if (newSize) {
					attributes.width = newSize.width + "px";
					attributes.height = newSize.height + "px";
				}
				URL.revokeObjectURL(urlToImage);
			}

			updateAttributes(attributes);
		},
		[getPos, node, apiUrlCreator, updateAttributes],
	);

	return (
		<NodeViewContextableWrapper
			data-drag-handle
			data-qa="qa-drawio"
			draggable={true}
			props={props}
			ref={hoverElement}
		>
			<BlockActionPanel
				actionsOptions={{ comment: true }}
				getPos={getPos}
				hasSignature={hasSignature}
				hoverElementRef={hoverElement}
				isSignature={hasSignature}
				rightActions={
					isEditable && (
						<DrawioActions
							editor={editor}
							node={node}
							openEditor={openEditor}
							setHasSignature={setHasSignature}
							signatureRef={signatureRef}
						/>
					)
				}
				setHasSignature={setHasSignature}
				signatureRef={signatureRef}
				signatureText={node.attrs.title}
				updateAttributes={updateAttributesCallback}
			>
				<Drawio
					commentId={node.attrs.comment?.id}
					height={node.attrs.height}
					id={getDrawioID(nodeSrc, articleProps.logicPath)}
					noEm={isEditable}
					openEditor={openEditor}
					ref={refT}
					src={nodeSrc}
					title={node.attrs.title}
					width={node.attrs.width}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default DrawioComponent;
