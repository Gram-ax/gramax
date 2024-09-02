import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { RefObject, useEffect, useRef, useState } from "react";
import { AnnotationObject } from "../../../edit/model/imageEditorTypes";
import { cssMedia } from "@core-ui/utils/cssUtils";

interface AnnotationObjectProps extends AnnotationObject {
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	index: number;
	selected: boolean;
	className?: string;
	drawIndexes?: boolean;
}

const Annotation = (props: AnnotationObjectProps) => {
	const { index, drawIndexes, text, x, y, editable, selected, onClick, changeData, parentRef, className } = props;
	const mainRef = useRef<HTMLDivElement>(null);

	const [position, setPosition] = useState({ left: 0, top: 0 });
	const [isHover, setHover] = useState<boolean>(false);
	const [isDraggable, setDraggable] = useState<boolean>(false);
	const [isSelected, setSelected] = useState<boolean>(false);
	const [curIndex, setCurIndex] = useState<number>(null);
	const [tooltipText, setTooltipText] = useState<string>(text);

	useEffect(() => {
		setPosition({ left: x, top: y });
		setCurIndex(index);
		setSelected(selected);
		setTooltipText(text);
	}, [x, y, selected, index, text]);

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
			const x = parseFloat(main.style.left);
			const y = parseFloat(main.style.top);

			if (changeData && (Math.round(x) !== position.left || Math.round(y) !== position.top)) {
				changeData(curIndex, { x: x, y: y });
			}
		},
	});

	return (
		<Tooltip
			hideInMobile={false}
			visible={tooltipText && tooltipText.length > 0 && isHover}
			content={<span>{tooltipText}</span>}
		>
			<div
				id={"object/" + curIndex}
				ref={mainRef}
				onMouseEnter={() => !isDraggable && setHover(true)}
				onMouseLeave={() => setHover(false)}
				onMouseDown={mainMouseDown}
				className={className + (isSelected ? " selected" : "")}
				style={{ left: position.left + "%", top: position.top + "%" }}
			>
				{drawIndexes && curIndex < 9 && <p>{curIndex + 1}</p>}
			</div>
		</Tooltip>
	);
};

export default styled(Annotation)`
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #fc2847;
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	pointer-events: auto !important;
	${(p) => `border-${p.direction}-radius: 4px;`}
	${(p) => p.editable && "cursor: grab;"}

	:active {
		${(p) => p.editable && "cursor: grabbing;"}
	}

	p {
		color: #fff;
		line-height: normal;
		font-size: 14px;
		font-weight: 600;
		padding: 0;
		margin: 0 !important;
		user-select: none;
		pointer-events: none;
	}

	${cssMedia.narrow} {
		::before {
			content: "";
			position: absolute;
			inset: -12px;
			border-radius: 50%;
			background-color: transparent;
		}
	}
`;
