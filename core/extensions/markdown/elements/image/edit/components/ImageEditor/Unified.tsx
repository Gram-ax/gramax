import Pointer from "@ext/markdown/elements/image/edit/components/ImageEditor/Pointer";
import Square from "@ext/markdown/elements/image/edit/components/ImageEditor/Square";
import TextImage from "@ext/markdown/elements/image/edit/components/ImageEditor/Text";
import {
	ImageObject,
	ImageObjectTypes,
	PointerObject,
	SquareObject,
	TextObject,
} from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { RefObject } from "react";

const UnifiedComponent = (
	props: ImageObject & { selected: boolean; index: number; parentRef: RefObject<HTMLDivElement>; editable: boolean },
) => {
	const { type, index, parentRef, editable, selected, ...otherProps } = props;

	switch (type) {
		case ImageObjectTypes.Arrow:
			return (
				<Pointer
					type={type}
					index={index}
					parentRef={parentRef}
					editable={editable}
					selected={selected}
					{...(otherProps as PointerObject)}
				/>
			);
		case ImageObjectTypes.Text:
			return (
				<TextImage
					type={type}
					index={index}
					parentRef={parentRef}
					editable={editable}
					selected={selected}
					{...(otherProps as TextObject)}
				/>
			);
		case ImageObjectTypes.Square:
			return (
				<Square
					type={type}
					index={index}
					parentRef={parentRef}
					editable={editable}
					selected={selected}
					{...(otherProps as SquareObject)}
				/>
			);
		default:
			return null;
	}
};

export default UnifiedComponent;
