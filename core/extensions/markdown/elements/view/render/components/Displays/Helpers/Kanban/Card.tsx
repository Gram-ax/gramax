import { ViewRenderData } from "@ext/properties/models";
import { useDrag } from "react-dnd";
import { CSSProperties, useEffect, useMemo } from "react";
import { getEmptyImage } from "react-dnd-html5-backend";
import CardPreview from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/CardPreview";
import { DragItems } from "@ext/properties/models/kanban";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import { useRouter } from "@core/Api/useRouter";

const getStyles = (isDragging: boolean): CSSProperties => {
	return {
		opacity: isDragging ? 0.75 : 1,
		border: isDragging ? "1px dashed var(--color-line)" : "",
	};
};

interface CardProps extends ViewRenderData {
	columnID: number;
	cardID: number;
	disabled?: boolean;
}

const Card = ({ columnID, cardID, linkPath, title, otherProps, resourcePath, disabled }: CardProps) => {
	const previewImage = useMemo(() => getEmptyImage(), []);
	const setLink = ArticleTooltipService.value;
	const router = useRouter();
	const [{ isDragging }, drag, preview] = useDrag({
		type: DragItems.Card,
		item: { columnID, cardID, itemData: { title, otherProps } },
		canDrag: () => !disabled,
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	});

	useEffect(() => {
		preview(previewImage, { captureDraggingState: true });
	}, []);

	return (
		<CardPreview
			title={title}
			otherProps={otherProps}
			onDragStart={() => setLink(null, null)}
			onMouseDown={() => setLink(null, null)}
			onMouseEnter={(e) => setLink(e.target as HTMLElement, resourcePath)}
			onDoubleClick={() => linkPath && router.pushPath(linkPath)}
			style={getStyles(isDragging)}
			ref={(el) => {
				drag(el);
			}}
		/>
	);
};

export default Card;
