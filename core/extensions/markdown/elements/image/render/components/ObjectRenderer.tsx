import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { RefObject, useEffect, useState } from "react";

interface ObjectRendererProps {
	imageRef: RefObject<HTMLImageElement>;
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	objects: ImageObject[];
	originalWidth?: string;
	selectedIndex?: number;
	hasOffset?: boolean;
	isLoaded?: boolean;
	changeData?: (index: number, data: any) => void;
	onClick?: (index: number) => void;
}

const ObjectRenderer = (props: ObjectRendererProps) => {
	const {
		imageRef,
		parentRef,
		editable,
		objects,
		originalWidth,
		selectedIndex,
		changeData,
		onClick,
		hasOffset = true,
		isLoaded,
	} = props;
	const [scaleFactor, setScaleFactor] = useState<number>(1);

	useEffect(() => {
		const containerWidth = parentRef.current?.clientWidth;
		const newOriginalWidth = originalWidth ? parseFloat(originalWidth) : imageRef.current?.naturalWidth;

		if (containerWidth && newOriginalWidth) setScaleFactor(containerWidth / newOriginalWidth);
	}, [parentRef.current, originalWidth, isLoaded]);

	if (!objects?.length) return null;

	return objects.map((data: ImageObject, index: number) => {
		if (!data?.direction) return null;
		const isNotTop = hasOffset && !data?.direction.includes("top");
		const isNotLeft = hasOffset && !data?.direction.includes("left");
		return (
			<UnifiedComponent
				key={index}
				index={index}
				parentRef={parentRef}
				{...data}
				selectedIndex={selectedIndex}
				style={{
					marginLeft: isNotLeft && `calc(-1.4em * ${1 - scaleFactor})`,
					marginTop: isNotTop && `calc(-1.4em * ${1 - scaleFactor})`,
				}}
				editable={editable}
				type={data.type}
				drawIndexes={objects.length > 1}
				onClick={onClick}
				changeData={changeData}
			/>
		);
	});
};

export default ObjectRenderer;
