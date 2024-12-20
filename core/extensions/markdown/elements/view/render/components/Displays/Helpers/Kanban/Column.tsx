import styled from "@emotion/styled";
import { Column as ColumnType, DragItems } from "@ext/properties/models/kanban";
import Card from "@ext/markdown/elements/view/render/components/Displays/Helpers/Kanban/Card";
import { useDrop } from "react-dnd";

interface ColumnProps extends ColumnType {
	id: number;
	disabled?: boolean;
	className?: string;
	onCardDrop: (columnID: number, cardID: number, newColumnID: number) => void;
	updateProperty: (columnID: number, cardID: number, property: string, value: string, isDelete?: boolean) => void;
}

const Column = ({ id, name, cards, className, onCardDrop, disabled, updateProperty }: ColumnProps) => {
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: DragItems.Card,
		canDrop: (item) => {
			return item.columnID !== id && !disabled;
		},
		drop: (item: { columnID: number; cardID: number }) => {
			onCardDrop(item.columnID, item.cardID, id);
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	});

	return (
		<div
			className={`${className} column`}
			ref={(el) => {
				drop(el);
			}}
		>
			<div className="column-name">
				<span>{name}</span>
			</div>
			<div className="column-cards">
				{cards?.map((card, index) => (
					<Card
						key={card.itemPath}
						disabled={disabled}
						columnID={id}
						cardID={index}
						updateProperty={updateProperty}
						{...card}
					/>
				))}
				{isOver && canDrop && <div className="empty-card"></div>}
			</div>
		</div>
	);
};

export default styled(Column)`
	min-width: 18em;

	.column-name {
		display: flex;
		width: 100%;
		border-bottom: 1px solid var(--color-line);
		font-weight: 400;

		> span {
			padding: 0.25em 12px;
		}
	}

	.column-cards {
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-medium);
		padding: 12px;
		gap: 0.5em;
	}

	.column-cards:empty {
		min-height: 11.5em;
	}

	.empty-card {
		border: 1px dashed var(--color-line);
		border-radius: var(--radius-medium);
		height: 5.5rem;
	}
`;
