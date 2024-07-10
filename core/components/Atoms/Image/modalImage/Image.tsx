import React, { useState, useEffect, useRef, MouseEventHandler, CSSProperties, ReactEventHandler } from "react";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { cropImage } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

interface ImageProps {
	id: string;
	className: string;
	crop: Crop;
	src: string;
	style: CSSProperties;
	handleDoubleClick;
	objects: ImageObject[];
	contextMenu: boolean;
}

const Image = (props: ImageProps) => {
	const { id, className, crop, src, style, handleDoubleClick, objects, contextMenu } = props;
	const imgRef = useRef(null);
	const imageContainerRef = useRef(null);
	const objectsContainerRef = useRef(null);
	const [elements, setElements] = useState([]);

	const handleOnContextMenu: MouseEventHandler<HTMLImageElement> = (event) => {
		if (!contextMenu) event.preventDefault();
	};

	const onLoadHandler: ReactEventHandler<HTMLImageElement> = (e) => {
		const target = e.target as HTMLImageElement;
		const parent = target.parentElement;

		const width = Math.round(target.clientWidth);
		const height = Math.round(target.clientHeight);

		parent.style.width = width + "px";
		parent.style.height = height + "px";

		target.style.width = width + "px";
		target.style.height = height + "px";

		target.style.position = "absolute";

		if (crop) cropImage({ image: target, imageSize: { w: width, h: height }, crop });
	};

	useEffect(() => {
		if (objects) setElements([...objects]);
	}, [objects]);

	return (
		<div className={"modal__container " + className} style={style}>
			<div ref={imageContainerRef} className="modal__container__image">
				<img
					id={id}
					className={className}
					ref={imgRef}
					onLoad={onLoadHandler}
					draggable="false"
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleOnContextMenu}
					src={src}
					alt=""
				/>

				{elements.length > 0 &&
					elements.map((data, index) => (
						<UnifiedComponent
							key={index}
							index={index}
							parentRef={objectsContainerRef}
							{...data}
							editable={false}
							selected={false}
							type={data.type}
							drawIndexes={elements.length > 1}
						/>
					))}
			</div>
		</div>
	);
};

export default Image;
