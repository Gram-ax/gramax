import Annotation from "@ext/markdown/elements/image/render/components/ImageEditor/Annotation";
import Square from "@ext/markdown/elements/image/render/components/ImageEditor/Square";
import {
	ImageObject,
	ImageObjectTypes,
	AnnotationObject,
	SquareObject,
} from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { RefObject, useEffect, useState } from "react";

const UnifiedComponent = (
	props: ImageObject & {
		index: number;
		parentRef: RefObject<HTMLDivElement>;
		editable: boolean;
		selectedIndex?: number;
		drawIndexes?: boolean;
	},
) => {
	const { type, index, parentRef, editable, selectedIndex, ...otherProps } = props;
	const [isSelected, setSelected] = useState<boolean>(false);

	useEffect(() => {
		setSelected(selectedIndex === index);
	}, [selectedIndex, index]);

	switch (type) {
		case ImageObjectTypes.Annotation:
			return (
				<Annotation
					type={type}
					index={index}
					parentRef={parentRef}
					editable={editable}
					selected={isSelected}
					{...(otherProps as AnnotationObject)}
				/>
			);
		case ImageObjectTypes.Square:
			return (
				<Square
					type={type}
					index={index}
					parentRef={parentRef}
					editable={editable}
					selected={isSelected}
					{...(otherProps as SquareObject)}
				/>
			);
		default:
			return null;
	}
};

export default UnifiedComponent;
