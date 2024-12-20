import Annotation from "@ext/markdown/elements/image/render/components/ImageEditor/Annotation";
import Square from "@ext/markdown/elements/image/render/components/ImageEditor/Square";
import {
	ImageObject,
	ImageObjectTypes,
	AnnotationObject,
	SquareObject,
} from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { CSSProperties, RefObject, useState } from "react";
import useWatch from "@core-ui/hooks/useWatch";

interface UnifiedComponentProps extends ImageObject {
	index: number;
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	selectedIndex?: number;
	drawIndexes?: boolean;
	style?: CSSProperties;
}

const UnifiedComponent = (props: UnifiedComponentProps) => {
	const { type, index, parentRef, editable, selectedIndex, style, ...otherProps } = props;
	const [isSelected, setSelected] = useState<boolean>(false);

	useWatch(() => {
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
					style={style}
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
					style={style}
					{...(otherProps as SquareObject)}
				/>
			);
		default:
			return null;
	}
};

export default UnifiedComponent;
