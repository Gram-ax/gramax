import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { CSSProperties, RefObject, useRef, useState } from "react";
import { AnnotationObject } from "../../../edit/model/imageEditorTypes";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { classNames } from "@components/libs/classNames";

interface AnnotationObjectProps extends AnnotationObject {
	parentRef: RefObject<HTMLDivElement>;
	editable: boolean;
	index: number;
	selected: boolean;
	className?: string;
	drawIndexes?: boolean;
	style?: CSSProperties;
}

const Annotation = (props: AnnotationObjectProps) => {
	const { index, drawIndexes, text, x, y, editable, selected, onClick, changeData, parentRef, className, style } =
		props;
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
		onMouseUpCallback: (newX, newY) => {
			const isNotEqual = Math.round(newX) !== x || Math.round(newY) !== y;
			if (changeData && isNotEqual) changeData(index, { x: newX, y: newY });
		},
	});

	return (
		<Tooltip hideInMobile={false} disabled={isDraggable} trigger="mouseenter focus" content={text}>
			<div
				id={"object/" + index}
				ref={mainRef}
				onMouseDown={mainMouseDown}
				className={classNames(className, { selected })}
				style={{
					...style,
					left: x + "%",
					top: y + "%",
				}}
			>
				{drawIndexes && index < 9 && <p>{index + 1}</p>}
			</div>
		</Tooltip>
	);
};

export default styled(Annotation)`
	font-size: 1em;
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #fc2847;
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
	width: 1.4em;
	height: 1.4em;
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
		font-size: 0.8em;
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
