import t from "@ext/localization/locale/translate";
import { useState, useCallback, useMemo, useEffect, CSSProperties } from "react";
import { IconButton } from "@ui-kit/Button";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

interface Value {
	id: string;
	text: string;
}

interface ValueHandlerProps {
	data?: string[];
	onChange?: (values: string[]) => void;
}

interface SortableValueProps {
	value: Value;
}

const SortableValue = ({ value }: SortableValueProps) => {
	const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
		id: value.id,
	});

	const style: CSSProperties = useMemo(
		() => ({
			transform: CSS.Transform.toString(transform),
			transition: transition,
			opacity: isDragging ? 0.8 : 1,
			zIndex: isDragging ? 1 : 0,
			position: "relative",
			display: "flex",
			alignItems: "center",
			gap: "8px",
		}),
		[transform, transition, isDragging],
	);

	const iconButtonStyle: CSSProperties = useMemo(
		() => ({
			padding: "0",
			height: "auto",
		}),
		[],
	);

	const onClick = useCallback((e: Event) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return (
		<DropdownMenuItem onSelect={onClick}>
			<div ref={setNodeRef} style={style} className="sortable-value">
				<div {...listeners} {...attributes} className="flex items-center justify-center">
					<IconButton type="button" variant="text" size="sm" style={iconButtonStyle} icon="grip-vertical" />
				</div>
				<div className="flex-1">{value.text}</div>
			</div>
		</DropdownMenuItem>
	);
};

const ValueHandler = ({ data, onChange }: ValueHandlerProps) => {
	const [values, setValues] = useState<Value[]>(
		() => data?.map((value, index) => ({ id: `value-${index}`, text: value })) || [],
	);

	const memoizedData = useMemo(() => data, [data]);
	useEffect(() => {
		if (memoizedData) {
			setValues(memoizedData.map((value, index) => ({ id: `value-${index}`, text: value })));
		}
	}, [memoizedData]);

	const submitChanges = useCallback(
		(newValues: Value[]) => {
			const filteredValues = newValues.filter((v) => v.text.trim().length > 0).map((v) => v.text);
			onChange?.(filteredValues);
		},
		[onChange],
	);

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 10,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 300,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor, {}),
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				setValues((prevValues) => {
					const oldIndex = prevValues.findIndex((v) => v.id === active.id);
					const newIndex = prevValues.findIndex((v) => v.id === over.id);

					if (oldIndex === -1 || newIndex === -1) return prevValues;

					const newValues = arrayMove(prevValues, oldIndex, newIndex);
					submitChanges(newValues);
					return newValues;
				});
			}
		},
		[submitChanges],
	);

	const valueIds = useMemo(() => values.map((v) => v.id), [values]);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
		>
			{values?.length ? (
				<SortableContext items={valueIds} strategy={verticalListSortingStrategy}>
					{values.map((value) => (
						<SortableValue key={value.id} value={value} />
					))}
				</SortableContext>
			) : (
				<div className="empty-state">{t("properties.no-values")}</div>
			)}
		</DndContext>
	);
};

export default ValueHandler;
