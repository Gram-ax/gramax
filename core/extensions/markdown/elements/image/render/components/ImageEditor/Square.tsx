import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { handleMove, objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { ReactElement, RefObject, useEffect, useRef, useState } from "react";
import { SquareObject } from "../../../edit/model/imageEditorTypes";

interface SquareObjectProps extends SquareObject {
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	index: number;
	selected: boolean;
	className?: string;
	drawIndexes?: boolean;
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
	} = props;
	const [isSelected, setSelected] = useState<boolean>(Boolean(selected));
	const [isDraggable, setDraggable] = useState<boolean>(false);
	const [isTooltipHover, setTooltipHover] = useState<boolean>(false);
	const [curIndex, setCurIndex] = useState<number>(null);
	const [tooltipText, setTooltipText] = useState<string>(text);

	const mainRef = useRef<HTMLDivElement>(null);

	const mainMouseDown = objectMove({
		isDraggable,
		parentRef,
		mainRef,
		setDraggable,
		onMouseDownCallback: () => {
			if (!editable) return false;
			if (onClick) onClick(curIndex);
			return true;
		},
		onMouseUpCallback: function (): void {
			const main = mainRef.current;
			const newX = parseFloat(main.style.left);
			const newY = parseFloat(main.style.top);
			const newW = parseFloat(main.style.width);
			const newH = parseFloat(main.style.height);

			if (
				changeData &&
				(Math.round(newX) !== x || Math.round(newY) !== y || Math.round(newW) !== w || Math.round(newH) !== h)
			) {
				changeData(curIndex, {
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
			if (onClick) onClick(curIndex);
			return true;
		},
		onMouseUpCallback: () => {
			const main = mainRef.current;
			const newX = parseFloat(main.style.left);
			const newY = parseFloat(main.style.top);
			const newW = parseFloat(main.style.width);
			const newH = parseFloat(main.style.height);

			if (
				changeData &&
				(Math.round(newX) !== x || Math.round(newY) !== y || Math.round(newW) !== w || Math.round(newH) !== h)
			) {
				changeData(curIndex, {
					x: newX,
					y: newY,
					w: newW,
					h: newH,
				});
			}
		},
	});

	useEffect(() => {
		setCurIndex(index);
		setSelected(selected);
		setTooltipText(text);
	}, [selected, index, text]);

	return (
		<Tooltip
			hideInMobile={false}
			visible={tooltipText.length > 0 && isTooltipHover}
			content={<span>{tooltipText}</span>}
		>
			<div
				id={"object/" + index}
				ref={mainRef}
				onMouseEnter={() => !isDraggable && setTooltipHover(true)}
				onMouseLeave={() => setTooltipHover(false)}
				onMouseDown={mainMouseDown}
				style={{
					left: x + "%",
					top: y + "%",
					width: w + "%",
					height: h + "%",
				}}
				className={className + (isSelected ? " selected" : "")}
			>
				{drawIndexes && (
					<div className={`annotation annotation-${direction}`}>{curIndex < 9 && <p>{curIndex + 1}</p>}</div>
				)}

				{editable && isSelected && (
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
		width: 22px;
		height: 22px;
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
		font-size: 14px;
		font-weight: 600;
		padding: 0;
		margin: 0 !important;
		user-select: none;
		pointer-events: none;
	}

	.handle {
		position: absolute;
		width: 30px;
		height: 30px;
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
