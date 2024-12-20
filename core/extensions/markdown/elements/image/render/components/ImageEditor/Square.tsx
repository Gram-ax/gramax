import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { handleMove, objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { CSSProperties, ReactElement, RefObject, useRef, useState } from "react";
import { SquareObject } from "../../../edit/model/imageEditorTypes";
import { classNames } from "@components/libs/classNames";

interface SquareObjectProps extends SquareObject {
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	index: number;
	selected: boolean;
	className?: string;
	drawIndexes?: boolean;
	style?: CSSProperties;
}

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
	} = props;
	const mainRef = useRef<HTMLDivElement>(null);
	const [isDraggable, setDraggable] = useState<boolean>(false);

	const mainMouseDown = objectMove({
		isDraggable,
		parentRef,
		mainRef,
		setDraggable,
		onMouseDownCallback: () => {
			if (!editable) return false;
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
		setDraggable,
		parentRef,
		mainRef,
		onMouseDownCallback: () => {
			if (!editable) return false;
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
		<Tooltip hideInMobile={false} disabled={isDraggable} trigger="mouseenter focus" content={text}>
			<div
				id={"object/" + index}
				ref={mainRef}
				onMouseDown={mainMouseDown}
				style={{
					...style,
					left: x + "%",
					top: y + "%",
					width: w + "%",
					height: h + "%",
				}}
				className={classNames(className, { selected })}
			>
				{drawIndexes && (
					<div className={`annotation annotation-${direction}`}>{index < 9 && <p>{index + 1}</p>}</div>
				)}

				{editable && selected && (
					<div>
						<div onMouseDown={onMouseDown} id="top-left" className="handle top-left"></div>
						<div onMouseDown={onMouseDown} id="top-right" className="handle top-right"></div>
						<div onMouseDown={onMouseDown} id="bottom-right" className="handle bottom-right"></div>
						<div onMouseDown={onMouseDown} id="bottom-left" className="handle bottom-left"></div>
					</div>
				)}
			</div>
		</Tooltip>
	);
};

export default styled(Square)`
	position: absolute;
	border: 3px solid #fc2847;
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
		left: -12px;
		top: -12px;
	}

	.annotation-top-right {
		right: -12px;
		top: -12px;
	}

	.annotation-bottom-left {
		left: -12px;
		bottom: -12px;
	}

	.annotation-bottom-right {
		right: -12px;
		bottom: -12px;
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
`;
