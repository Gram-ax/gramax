import useWatch from "@core-ui/hooks/useWatch";
import { ImageObject, ImageObjectTypes } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import Annotation from "@ext/markdown/elements/image/render/components/ImageEditor/Annotation";
import Square from "@ext/markdown/elements/image/render/components/ImageEditor/Square";
import { CSSProperties, RefObject, useState } from "react";

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
			index={index}
			parentRef={parentRef}
			selected={isSelected}
			style={style}
			type={type}
			{...otherProps}
		/>
	) : null;
};

export default UnifiedComponent;
