import Caption from "@components/controls/Caption";
import useWatch from "@core-ui/hooks/useWatch";
import toggleSignature from "@core-ui/toggleSignature";
import Path from "@core/FileProvider/Path/Path";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ImageActions from "@ext/markdown/elements/image/edit/components/ImageActions";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { getBlobFromBuffer } from "@ext/markdown/elements/image/render/logic/cropImage";
import { Editor } from "@tiptap/core";
import { ReactElement, RefObject, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface ImageDataProps {
	editor: Editor;
	id: string;
	title: string;
	objects: ImageObject[];
	src: string;
	alt: string;
	width: string;
	height: string;
	crop: Crop;
	scale: number;
	selected: boolean;
	hoverElementRef: RefObject<HTMLDivElement>;
	commentId?: string;
	getPos: () => number;
	updateAttributes?: (attributes: Record<string, any>) => void;
	className?: string;
}

const Image = (props: ImageDataProps): ReactElement => {
	const {
		editor,
		getPos,
		hoverElementRef,
		updateAttributes,
		selected,
		id,
		title,
		objects,
		src,
		alt,
		width,
		height,
		crop,
		commentId,
		scale,
	} = props;
	const resourceService = ResourceService.value;

	const isEditable = editor.isEditable;

	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && title?.length > 0);
	const [isHovered, setIsHovered] = useState(false);
	const isGif = new Path(src).extension == "gif";
	const showResizer = selected && isEditable;

	useWatch(() => {
		if (!hasSignature && title?.length) return setHasSignature(true);
	}, [title]);

	const focusToSignature = useCallback(() => {
		if (!hasSignature) signatureRef.current?.focus();
	}, [hasSignature]);

	const addSignature = useCallback(() => {
		setHasSignature((prev) => toggleSignature(prev, signatureRef.current, updateAttributes));
		focusToSignature();
	}, [signatureRef, updateAttributes, focusToSignature]);

	const handleEdit = useCallback(() => {
		const handleSave = (objects: ImageObject[], crop: Crop) => {
			updateAttributes({ crop, objects });
		};

		const element = document.body.appendChild(document.createElement("div"));
		element.setAttribute("id", "image-editor");

		const handleToggle = () => {
			document.body.removeChild(element);
		};

		const buffer = resourceService.getBuffer(src);
		const blob = getBlobFromBuffer(buffer);
		const newSrc = URL.createObjectURL(blob);

		const root = createRoot(element);
		root.render(
			<ImageEditor
				src={newSrc}
				crop={crop ?? { x: 0, y: 0, w: 100, h: 100 }}
				objects={objects ?? []}
				handleSave={handleSave}
				handleToggle={handleToggle}
			/>,
		);
	}, [updateAttributes, crop, objects, resourceService.data, src]);

	const onLoseFocus = useCallback(
		(e) => {
			const target = e.target as HTMLInputElement;
			if (target.value.length || hasSignature) return;

			updateAttributes({ title: "" });
			return setHasSignature(false);
		},
		[updateAttributes, hasSignature],
	);

	const onUpdate = useCallback((text) => updateAttributes({ title: text }), [updateAttributes]);

	return (
		<>
			<ImageRenderer
				id={id}
				title={title}
				objects={objects}
				src={src}
				alt={alt}
				width={width}
				height={height}
				commentId={commentId}
				scale={scale}
				crop={crop}
				noEm
				hoverElementRef={hoverElementRef}
				showResizer={showResizer}
				openEditor={handleEdit}
				realSrc={src}
				updateAttributes={updateAttributes}
				isHovered={isHovered}
				setIsHovered={setIsHovered}
				rightActions={
					isEditable && <ImageActions isGif={isGif} handleEdit={handleEdit} addSignature={addSignature} />
				}
			/>
			<Caption
				editor={editor}
				ref={signatureRef}
				text={title}
				onUpdate={onUpdate}
				onLoseFocus={onLoseFocus}
				visible={hasSignature}
				getPos={getPos}
			/>
		</>
	);
};

export default Image;
