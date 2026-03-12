import {
	type ImageObject,
	ImageObjectTypes,
	type SquareObject,
} from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { type RefObject, useLayoutEffect, useState } from "react";

interface ObjectRendererProps {
	imageRef: RefObject<HTMLImageElement>;
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	objects: ImageObject[];
	originalWidth?: string;
	selectedIndex?: number;
	hasOffset?: boolean;
	percentToPx?: boolean;
	changeData?: (index: number, data: unknown) => void;
	onClick?: (index: number) => void;
}

const getObjectKey = (index: number) => `object-${index}`;

const ObjectRenderer = (props: ObjectRendererProps) => {
	const {
		imageRef,
		parentRef,
		editable,
		objects,
		selectedIndex,
		changeData,
		onClick,
		hasOffset = true,
		percentToPx = false,
	} = props;
	const [scaleFactor, setScaleFactor] = useState<number>(1);

	useLayoutEffect(() => {
		const containerWidth = parentRef.current?.clientWidth;
		const newOriginalWidth = imageRef.current?.naturalWidth;

		if (containerWidth && newOriginalWidth) setScaleFactor(containerWidth / newOriginalWidth);
	}, [parentRef.current, imageRef.current]);

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
				key={getObjectKey(index)}
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
