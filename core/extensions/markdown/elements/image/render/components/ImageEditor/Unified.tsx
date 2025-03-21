import Annotation from "@ext/markdown/elements/image/render/components/ImageEditor/Annotation";
import Square from "@ext/markdown/elements/image/render/components/ImageEditor/Square";
import { ImageObject, ImageObjectTypes } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { CSSProperties, RefObject, useState } from "react";
import useWatch from "@core-ui/hooks/useWatch";

interface UnifiedComponentProps extends ImageObject {
	index: number;
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	selectedIndex?: number;
	drawIndexes?: boolean;
	style?: CSSProperties;
	isPixels?: boolean;
}

const Components: Record<ImageObjectTypes, React.FC<any>> = {
	[ImageObjectTypes.Unknown]: null,
	[ImageObjectTypes.Annotation]: Annotation,
	[ImageObjectTypes.Square]: Square,
};

const UnifiedComponent = (props: UnifiedComponentProps) => {
	const { type, index, parentRef, editable, selectedIndex, style, ...otherProps } = props;
	const [isSelected, setSelected] = useState<boolean>(false);

	useWatch(() => {
		setSelected(selectedIndex === index);
	}, [selectedIndex, index]);

	const Component = Components[type];
	return Component ? (
		<Component
			editable={editable}
			selected={isSelected}
			parentRef={parentRef}
			style={style}
			type={type}
			index={index}
			{...otherProps}
		/>
	) : null;
};

export default UnifiedComponent;
