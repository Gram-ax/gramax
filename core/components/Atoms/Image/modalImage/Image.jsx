import React, { useState, useEffect, useRef } from "react";
import { SpinnerIcon } from "./icons";
import UnifiedComponent from "@ext/markdown/elements/image/edit/components/ImageEditor/Unified";

const Image = ({ id, className, src, style, handleDoubleClick, objects, contextMenu }) => {
  const [loading, setLoading] = useState(true);
  const imgRef = useRef(null);
  const imageContainerRef = useRef(null);
  const objectsContainerRef = useRef(null);
  const [elements, setElements] = useState([]);

  const handleOnLoad = () => setLoading(false);

  const handleOnContextMenu = (event) => {
    if (!contextMenu) {
      event.preventDefault();
    }
  };

  const onLoad = (event) => {
	handleOnLoad();
	const target = event.target;
	const objectsContainer = objectsContainerRef.current;
  if (!objectsContainer) return;
	objectsContainer.style.width = target.width + "px";
	objectsContainer.style.height = target.height + "px";
  }
  
  useEffect(() => {
	if (objects) {
		setElements([...objects]);
	}
  }, [objects]);

  return (
    <div ref={imageContainerRef}>
      {loading && <SpinnerIcon />}
      <img
        ref={imgRef}
        id={id}
        className={className}
        src={src}
        style={style}
        onDoubleClick={handleDoubleClick}
        onLoad={onLoad}
        onContextMenu={handleOnContextMenu}
      />

      {elements.length > 0 && <div ref={objectsContainerRef} className="__react_modal_image__objects">
		{elements.map((data, index) => (
			<UnifiedComponent
				key={index}
				index={index}
				parentRef={objectsContainerRef}
				{...data}
				editable={false}
				selected={false}
				type={data.type}
				style={{width: "3em", height: "3em"}}
			/>
		))}
      </div>}
    </div>
  );
};

export default Image;