import { ImageObject, ImageObjectTypes, SquareObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
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
	percentToPx?: boolean;
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
		percentToPx = false,
	} = props;
	const [scaleFactor, setScaleFactor] = useState<number>(1);

	useEffect(() => {
		const containerWidth = parentRef.current?.clientWidth;
		const newOriginalWidth = originalWidth ? parseFloat(originalWidth) : imageRef.current?.naturalWidth;

		if (containerWidth && newOriginalWidth) setScaleFactor(containerWidth / newOriginalWidth);
	}, [parentRef.current, originalWidth]);

	if (!objects?.length) return null;

	return objects.map((data: ImageObject, index: number) => {
		if (!data?.direction) return null;
		const isNotTop = hasOffset && !data?.direction.includes("top");
		const isNotLeft = hasOffset && !data?.direction.includes("left");
		const newData = { ...data } as SquareObject;
		const noStyles = data.type === ImageObjectTypes.Square;

		return (
			<UnifiedComponent
				index={index}
				isPixels={percentToPx}
				key={index}
				parentRef={parentRef}
				{...newData}
				changeData={changeData}
				drawIndexes={objects.length > 1}
				editable={editable}
				onClick={onClick}
				selectedIndex={selectedIndex}
				style={{
					marginLeft: noStyles ? undefined : isNotLeft && `calc(-1.4em * ${1 - scaleFactor})`,
					marginTop: noStyles ? undefined : isNotTop && `calc(-1.4em * ${1 - scaleFactor})`,
				}}
				type={data.type}
			/>
		);
	});
};

export default ObjectRenderer;
