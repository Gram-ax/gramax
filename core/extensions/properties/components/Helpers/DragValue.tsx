import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { DragItems } from "@ext/properties/models/kanban";
import { memo, useCallback, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

interface DragValueProps {
	id: number;
	text: string;
	moveValue: (draggedId: number, hoveredId: number) => void;
	onDelete: (id: number) => void;
	updateValue: (text: string, id: number) => void;
	onDragEnd: () => void;
	onInputBlur: (text: string, id: number) => void;
	isActions?: boolean;
	isEditable?: boolean;
	className?: string;
}

const DragValue = memo((props: DragValueProps) => {
	const { id, text, className, moveValue, onDelete, updateValue, onDragEnd, onInputBlur, isActions, isEditable } =
		props;

	const inputRef = useRef<HTMLInputElement>(null);
	const [localText, setLocalText] = useState(text);

	if (localText !== text) {
		setLocalText(text);
	}

	const [{ isDragging }, drag, preview] = useDrag({
		type: DragItems.Value,
		item: { id },
		canDrag: isActions,
		end: onDragEnd,
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [, drop] = useDrop({
		accept: DragItems.Value,
		hover: (item: { id: number }) => {
			if (item.id === id) return;
			moveValue(item.id, id);
		},
	});

	const handleDelete = useCallback(() => {
		onDelete(id);
	}, [onDelete, id]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newText = e.target.value;
			setLocalText(newText);
			updateValue(newText, id);
		},
		[updateValue, id],
	);

	const handleInputBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			const newText = e.target.value;
			onInputBlur(newText, id);
		},
		[onInputBlur, id],
	);

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			inputRef.current?.blur();
		}
	}, []);

	return (
		<div
			ref={(ref) => {
				drop(ref);
				preview(ref);
			}}
			className={classNames(className, {
				isDragging,
				isEditable: isActions,
			})}
		>
			<div className="content">
				{isActions && (
					<Icon code="grip-vertical" isAction className="drag-icon" ref={(ref) => void drag(ref)} />
				)}
				<Input
					type="text"
					ref={inputRef}
					value={localText}
					autoFocus
					onChange={handleInputChange}
					onBlur={handleInputBlur}
					onKeyDown={handleKeyDown}
					readOnly={!isEditable}
				/>
			</div>
			{isEditable && (
				<div className="actions">
					<Icon code="trash-2" onClick={handleDelete} isAction tooltipContent={t("delete")} />
				</div>
			)}
		</div>
	);
});

DragValue.displayName = "DragValue";

export default styled(DragValue)`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 0.25em;
	margin-bottom: 0.25em;
	border-radius: var(--radius-small);

	.content {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 0.5em;
	}

	.drag-icon {
		cursor: grab;
		flex-shrink: 0;
	}

	&:hover {
		background-color: var(--color-nav-article-drop-target);
	}

	.actions {
		display: flex;
		gap: 0.25em;
		margin-left: 0.5em;
		flex-shrink: 0;
	}

	&.isEditable {
		background-color: var(--color-code-bg);
	}

	&.isDragging {
		background-color: var(--color-nav-article-drop-target);
		opacity: 0.5;
	}
`;
