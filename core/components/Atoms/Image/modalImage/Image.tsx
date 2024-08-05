import React, { useState, useEffect, useRef, MouseEventHandler, CSSProperties } from "react";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

interface ImageProps {
	id: string;
	className: string;
	src: string;
	style: CSSProperties;
	handleDoubleClick;
	objects: ImageObject[];
	contextMenu: boolean;
}

const Image = (props: ImageProps) => {
	const { id, className, src, style, handleDoubleClick, objects, contextMenu } = props;
	const imgRef = useRef(null);
	const imageContainerRef = useRef(null);
	const objectsContainerRef = useRef(null);
	const [elements, setElements] = useState([]);

	const handleOnContextMenu: MouseEventHandler<HTMLImageElement> = (event) => {
		if (!contextMenu) event.preventDefault();
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
