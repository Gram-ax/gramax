import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { HELPERS_LEFT, VERTICAL_TOP_OFFSET } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { MouseEvent, RefObject, useState } from "react";

interface PlusActionsProps {
	onClick: (index) => void;
	tableRef: RefObject<HTMLElement>;
	index?: number;
	className?: string;
	vertical?: boolean;
	dataQa?: string;
}

type HoveredData = {
	width: string;
	height: string;
};

const Line = styled.div`
	position: absolute;
	top: 1em;
	opacity: 0.13;
	background-color: var(--color-table-action-add);
	pointer-events: none;

	&.vertical {
		top: 5px;
		left: 1em;
	}

	&.horizontal {
		top: 1em;
		left: 0.4em;
	}
`;

const PlusActions = (props: PlusActionsProps) => {
	const { index, className, vertical, onClick, dataQa, tableRef } = props;
	const [hoveredData, setHoveredData] = useState<HoveredData>(null);
	const preOnClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClick(index);
	};

	const preOnMouseEnter = () => {
		const table = tableRef.current;
		const hoveredData = {
			width: vertical ? `calc(${table.clientWidth}px)` : "5px",
			height: vertical ? "5px" : `calc(${table.clientHeight}px)`,
		};

		setHoveredData(hoveredData);
	};

	const preOnMouseLeave = () => {
		setHoveredData(null);
	};

	return (
		<div
			className={classNames(className, { vertical: vertical, horizontal: !vertical }, ["hidden"])}
			onMouseEnter={preOnMouseEnter}
			onMouseLeave={preOnMouseLeave}
			data-qa={dataQa}
		>
			{hoveredData && (
				<Line
					className={vertical ? "vertical" : "horizontal"}
					style={{ width: hoveredData.width, height: hoveredData.height }}
				/>
			)}
			<div className="plus-actions-icon" onClick={preOnClick}>
				<Icon code="plus" />
			</div>
			<span className="plus-actions-circle" />
		</div>
	);
};

export default styled(PlusActions)`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1rem;
	height: 1rem;

	&.hidden {
		pointer-events: none;
	}

	.plus-actions-icon {
		display: none;
		align-items: center;
		cursor: pointer;
		color: var(--color-article-text);
		background-color: var(--color-table-plus-bg);
		border: 1px solid var(--color-table-plus-border);
		border-radius: var(--radius-full);
		stroke-width: 2rem;
		justify-content: center;
		padding: 0.44rem;
		width: 0;
		height: 0;
		z-index: 1000;
		pointer-events: none;
	}

	.plus-actions-circle {
		display: flex;
		width: 3px;
		height: 3px;
		border-radius: var(--radius-full);
		background-color: var(--color-line);
	}

	&:hover .plus-actions-icon {
		display: flex;
		pointer-events: auto;
	}

	&:hover .plus-actions-circle {
		display: none;
	}

	i {
		font-size: 11px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	svg {
		stroke-width: 0.2rem;
	}

	&.horizontal {
		right: calc(-100% + ${HELPERS_LEFT});
	}

	&.vertical {
		left: ${HELPERS_LEFT};
		top: -${VERTICAL_TOP_OFFSET};
	}
`;
