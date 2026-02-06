import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { handleMove, objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { CSSProperties, ReactElement, RefObject, useEffect, useRef, useState } from "react";
import { SquareObject } from "../../../edit/model/imageEditorTypes";

interface SquareObjectProps extends SquareObject {
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	index: number;
	selected: boolean;
	className?: string;
	drawIndexes?: boolean;
	style?: CSSProperties;
	isPixels?: boolean;
}

type SquareVector = {
	x: number;
	y: number;
	w: number;
	h: number;
};

const Square = (props: SquareObjectProps): ReactElement => {
	const {
		index,
		drawIndexes,
		text,
		direction,
		x,
		y,
		w,
		h,
		editable,
		selected,
		onClick,
		changeData,
		parentRef,
		className,
		style,
		isPixels,
	} = props;
	const mainRef = useRef<HTMLDivElement>(null);
	const [isDraggable, setDraggable] = useState<boolean>(false);
	const [position, setPosition] = useState<SquareVector>({ x: 0, y: 0, w: 0, h: 0 });
	const unitType = isPixels ? "px" : "%";

	useEffect(() => {
		const imageContainer = parentRef.current;
		const imageContainerRect = imageContainer.getBoundingClientRect();

		setPosition({
			x: isPixels ? (imageContainerRect.width * x) / 100 : x,
			y: isPixels ? (imageContainerRect.height * y) / 100 : y,
			w: isPixels ? (imageContainerRect.width * w) / 100 : w,
			h: isPixels ? (imageContainerRect.height * h) / 100 : h,
		});
	}, [x, y, w, h, isPixels]);

	const mainMouseDown = objectMove({
		editable,
		isDraggable,
		parentRef,
		mainRef,
		setDraggable,
		onMouseDownCallback: () => {
			onClick?.(index);
			return true;
		},
		onMouseUpCallback: function (newX, newY, newW, newH): void {
			const isNotEqual =
				Math.round(newX) !== x || Math.round(newY) !== y || Math.round(newW) !== w || Math.round(newH) !== h;

			if (changeData && isNotEqual) {
				changeData(index, {
					x: newX,
					y: newY,
					w: newW,
					h: newH,
				});
			}
		},
	});

	const onMouseDown = handleMove({
		editable,
		setDraggable,
		parentRef,
		mainRef,
		onMouseDownCallback: () => {
			onClick?.(index);
			return true;
		},
		onMouseUpCallback: (newX, newY, newW, newH) => {
			const isNotEqual =
				Math.round(newX) !== x || Math.round(newY) !== y || Math.round(newW) !== w || Math.round(newH) !== h;

			if (changeData && isNotEqual) {
				changeData(index, {
					x: newX,
					y: newY,
					w: newW,
					h: newH,
				});
			}
		},
	});

	return (
		<Tooltip content={text} disabled={isDraggable} hideInMobile={false} trigger="mouseenter focus">
			<div
				className={classNames(className, { selected })}
				id={"object/" + index}
				onMouseDown={mainMouseDown}
				ref={mainRef}
				style={{
					...style,
					left: position.x + unitType,
					top: position.y + unitType,
					width: position.w + unitType,
					height: position.h + unitType,
				}}
			>
				{drawIndexes && (
					<div className={`annotation annotation-${direction}`}>
						<p>{index + 1}</p>
					</div>
				)}

				{editable && selected && (
					<div>
						<div className="handle top-left" id="top-left" onMouseDown={onMouseDown}></div>
						<div className="handle top-right" id="top-right" onMouseDown={onMouseDown}></div>
						<div className="handle bottom-right" id="bottom-right" onMouseDown={onMouseDown}></div>
						<div className="handle bottom-left" id="bottom-left" onMouseDown={onMouseDown}></div>
					</div>
				)}
			</div>
		</Tooltip>
	);
};

export default styled(Square)`
	position: absolute;
	border: 0.2em solid #fc2847;
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
	border-radius: 4px;
	pointer-events: auto !important;
	${(p) => p.editable && "cursor: grab;"}

	:active {
		${(p) => p.editable && "cursor: grabbing;"}
	}

	.annotation {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #fc2847;
		width: 1.4em;
		height: 1.4em;
		border-radius: 50%;
		pointer-events: auto !important;
	}

	.annotation-top-left {
		left: -0.8em;
		top: -0.8em;
	}

	.annotation-top-right {
		right: -0.8em;
		top: -0.8em;
	}

	.annotation-bottom-left {
		left: -0.8em;
		bottom: -0.8em;
	}

	.annotation-bottom-right {
		right: -0.8em;
		bottom: -0.8em;
	}

	.annotation p {
		color: #fff;
		line-height: normal;
		font-size: 0.8em;
		font-weight: 600;
		padding: 0;
		margin: 0 !important;
		user-select: none;
		pointer-events: none;
	}

	.handle {
		position: absolute;
		width: 50%;
		height: 50%;
		max-width: 30px;
		max-height: 30px;
		border: 2px solid #1476ff;
		user-select: none;
		z-index: var(--z-index-base);
		transition: all 0.3s ease;
		opacity: 0;
	}

	.top-left {
		left: -6px;
		top: -6px;
		cursor: nwse-resize;
		border-right: none;
		border-bottom: none;
	}

	.top-right {
		right: -6px;
		top: -6px;
		cursor: nesw-resize;
		border-left: none;
		border-bottom: none;
	}

	.bottom-left {
		left: -6px;
		bottom: -6px;
		border-top: none;
		border-right: none;
		cursor: nesw-resize;
	}

	.bottom-right {
		right: -6px;
		bottom: -6px;
		border-left: none;
		border-top: none;
		cursor: nwse-resize;
	}

	${cssMedia.narrow} {
		font-size: 0.8em;
	}
`;
