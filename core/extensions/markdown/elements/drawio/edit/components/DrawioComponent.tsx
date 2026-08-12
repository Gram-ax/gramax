/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: it's ok */

import BlockActionPanel from "@components/BlockActionPanel";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Base64ToDataImage, DataImageToBase64, isDataImage } from "@core-ui/Base64Converter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import DrawioActions from "@ext/markdown/elements/drawio/edit/components/DrawioActions";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import useDrawioEditor from "@ext/markdown/elements/drawio/edit/logic/useDrawioEditor";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import type { NodeViewProps } from "@tiptap/react";
import { type ReactElement, useCallback, useRef, useState } from "react";
import Drawio from "../../render/component/Drawio";

const DrawioComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes, selected } = props;
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
			if (!buffer?.byteLength || !refT.current) return;
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

	const openEditor = useDrawioEditor({
		diagramsServiceUrl: pageDataContext.settings?.services?.["diagram-renderer"]?.endpoint,
		imgRef: refT,
		saveCallBack,
		setImgData: () => {
			setImgData();
		},
	});

	const updateAttributesCallback = useCallback(
		async (attributes: Record<string, any>) => {
			const url = apiUrlCreator.getArticleResource(node.attrs.src);
			const res = await FetchService.fetch(url);

			if (res.ok) {
				const buffer = await res.buffer();
				const urlToImage = URL.createObjectURL(new Blob([buffer as any], { type: resolveFileKind(buffer) }));
				const newSize = await getNaturalSize(urlToImage);
				if (newSize) {
					attributes.width = `${newSize.width}px`;
					attributes.height = `${newSize.height}px`;
				}
				URL.revokeObjectURL(urlToImage);
			}

			updateAttributes(attributes);
		},
		[node, apiUrlCreator, updateAttributes],
	);

	const saveResize = useCallback(
		(resize: string) => {
			void updateAttributesCallback({ scale: resize });
		},
		[updateAttributesCallback],
	);

	return (
		<NodeViewContextableWrapper
			data-component="drawio"
			data-drag-handle
			data-qa="qa-drawio"
			data-resize-container
			draggable={true}
			props={props}
			ref={hoverElement}
		>
			<ArticleComponentResizer
				disabled={!isEditable}
				onChange={saveResize}
				scale={node.attrs.scale}
				selected={selected}
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
						scale={node.attrs.scale}
						src={nodeSrc}
						title={node.attrs.title}
						width={node.attrs.width}
					/>
				</BlockActionPanel>
			</ArticleComponentResizer>
		</NodeViewContextableWrapper>
	);
};

export default DrawioComponent;
