import { ViewRenderData } from "@ext/properties/models";
import { useDrag } from "react-dnd";
import { CSSProperties, MouseEvent, useEffect, useMemo, useRef } from "react";
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
	updateProperty: (columnID: number, cardID: number, property: string, value: string, isDelete?: boolean) => void;
}

const Card = ({ columnID, cardID, linkPath, title, otherProps, resourcePath, disabled, updateProperty }: CardProps) => {
	const previewImage = useMemo(() => getEmptyImage(), []);
	const cardRef = useRef<HTMLDivElement>(null);
	const { setLink, removeLink } = ArticleTooltipService.value;
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

	const styles = useMemo(() => getStyles(isDragging), [isDragging]);

	const onMouseEnter = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (target.closest(".chips")) return removeLink(resourcePath);
		setLink(cardRef.current as HTMLElement, resourcePath);
	};

	const onDoubleClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (target.closest(".chips")) return;
		linkPath && router.pushPath(linkPath);
	};

	const onSubmit = (propertyName: string, value: string, isDelete?: boolean) => {
		updateProperty(columnID, cardID, propertyName, value, isDelete);
	};

	const removeLinkHandler = () => {
		removeLink(resourcePath);
	};

	return (
		<CardPreview
			title={title}
			otherProps={otherProps}
			isReadOnly={disabled}
			onSubmit={onSubmit}
			removeLink={removeLinkHandler}
			onMouseEnter={onMouseEnter}
			onDoubleClick={onDoubleClick}
			style={styles}
			ref={(el) => {
				drag(el);
				cardRef.current = el;
			}}
		/>
	);
};

export default Card;
