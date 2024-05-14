"use client";

import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useRef, useState } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import resolveModule from "@app/resolveModule/frontend";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import Lightbox from "@components/Atoms/Image/modalImage/Lightbox";
import UnifiedComponent from "@ext/markdown/elements/image/edit/components/ImageEditor/Unified";
import styled from "@emotion/styled";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import { cropImage } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";

const EditImage = ({ node, className, getPos }: NodeViewProps & { className: string }): ReactElement => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url =
		(linkCreator.isExternalLink(node?.attrs?.src) && node.attrs.src) ||
		(apiUrlCreator ? apiUrlCreator.getArticleResource(node?.attrs?.src) : null);
	const src = resolveModule("useImage")(url);

	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgElementRef = useRef<HTMLImageElement>(null);
	const pointersContainerRef = useRef<HTMLDivElement>(null);

	const [isOpen, setOpen] = useState(false);
	const [elements, setElements] = useState<ImageObject[]>([]);
	const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 100, h: 100 });

	useEffect(() => {
		if (!node) return;

		if (imgElementRef.current && imageContainerRef.current) {
			const imgElement = imgElementRef.current;
			const imageContainer = imageContainerRef.current;
			let updateCrop = false;

			if (crop && node.attrs?.crop && crop !== node.attrs?.crop) {
				updateCrop = true;
				setCrop(node.attrs.crop);
				imgElement.src = src;
			}

			imgElement.onload = function () {
				if (updateCrop) {
					cropImage(imgElement, imageContainer, src, node.attrs?.crop);
					updateCrop = false;
				}
				const objectsContainer = pointersContainerRef.current;
				if (!objectsContainer) return;
				objectsContainer.style.width = imgElement.width + "px";
				objectsContainer.style.height = imgElement.height + "px";
			};
		}

		setElements([...(node.attrs?.objects ?? [])]);
	}, [src, node]);

	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<div ref={imageContainerRef} className={className}>
					<span className="lightbox">
						{isOpen && (
							<Lightbox
								objects={node?.attrs?.objects}
								large={imgElementRef.current.src}
								onClose={() => setOpen(false)}
								noneShadow={false}
							/>
						)}
					</span>
					{src && (
						<img
							ref={imgElementRef}
							onClick={() => setOpen(true)}
							src={src}
							alt={node?.attrs?.alt}
							data-focusable="true"
						/>
					)}
					<em>{node?.attrs?.title}</em>

					{src && (
						<div ref={pointersContainerRef} className="objects">
							{elements.map((data: ImageObject, index: number) => (
								<UnifiedComponent
									key={index}
									index={index}
									parentRef={imageContainerRef}
									{...data}
									editable={false}
									selected={false}
									type={data.type}
								/>
							))}
						</div>
					)}
				</div>
			</Focus>
		</NodeViewWrapper>
	);
};

export default styled(EditImage)`
	position: relative;
	margin: 1rem auto;
	max-width: 100%;
	max-height: 100%;

	em {
		margin-top: 4px !important;
		margin-bottom: 0 !important;
	}

	img {
		max-width: 100%;
		margin: 0 auto;
	}

	.objects {
		font-size: 16px !important;
		position: absolute;
		display: block;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 100%;
		z-index: 0;
		user-select: none;
		margin: 0 auto !important;
		pointer-events: none;
	}

	.article img {
		user-select: none;
		margin: 0 auto !important;
	}
`;
