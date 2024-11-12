import CardPreview from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/CardPreview";
import { DragItems } from "@ext/properties/models/kanban";
import type { CSSProperties } from "react";
import type { XYCoord } from "react-dnd";
import { useDragLayer } from "react-dnd";

const layerStyles: CSSProperties = {
	position: "fixed",
	pointerEvents: "none",
	zIndex: 100,
	left: 0,
	top: 0,
	width: "100%",
	height: "100%",
	display: "inline-block",
	animation: "rotate 0s ease-in forwards",
};

function getItemStyles(initialOffset: XYCoord, currentOffset: XYCoord) {
	if (!initialOffset || !currentOffset) {
		return {
			display: "none",
		};
	}

	const { x, y } = currentOffset;
	const transform = `translate(${x}px, ${y}px)`;

	return {
		transform,
		WebkitTransform: transform,
	};
}

export const CustomDragLayer = () => {
	const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
		item: monitor.getItem(),
		itemType: monitor.getItemType(),
		initialOffset: monitor.getInitialSourceClientOffset(),
		currentOffset: monitor.getSourceClientOffset(),
		isDragging: monitor.isDragging(),
	}));

	const renderItem = () => {
		switch (itemType) {
			case DragItems.Card:
				return <CardPreview title={item.itemData.title} otherProps={item.itemData.otherProps} dragging />;
			default:
				return null;
		}
	};

	if (!isDragging) return null;

	return (
		<div style={layerStyles}>
			<div style={getItemStyles(initialOffset, currentOffset)}>{renderItem()}</div>
		</div>
	);
};
