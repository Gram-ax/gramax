import t from "@ext/localization/locale/translate";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useDrop } from "react-dnd";
import { DragItems } from "@ext/properties/models/kanban";
import DragValue from "./DragValue";

interface Value {
	id: number;
	text: string;
}

interface ValueHandlerProps {
	data?: string[];
	onChange?: (values: string[]) => void;
	isActions?: boolean;
	isEditable?: boolean;
}

const ValueHandler = ({ data, onChange, isActions = true, isEditable = true }: ValueHandlerProps) => {
	const [values, setValues] = useState<Value[]>(
		() => data?.map((value, index) => ({ id: index, text: value })) || [],
	);

	const [, drop] = useDrop(() => ({ accept: DragItems.Value }));

	const memoizedData = useMemo(() => data, [data]);
	useEffect(() => {
		if (memoizedData) {
			setValues(memoizedData.map((value, index) => ({ id: index, text: value })));
		}
	}, [memoizedData]);

	const submitChanges = useCallback(
		(newValues: Value[]) => {
			const filteredValues = newValues.filter((v) => v.text.trim().length > 0).map((v) => v.text);
			onChange?.(filteredValues);
		},
		[onChange],
	);

	const moveValue = useCallback((draggedId: number, hoveredId: number) => {
		setValues((prevValues) => {
			const draggedIndex = prevValues.findIndex((v) => v.id === draggedId);
			const hoveredIndex = prevValues.findIndex((v) => v.id === hoveredId);

			if (draggedIndex === -1 || hoveredIndex === -1) return prevValues;

			const newValues = [...prevValues];
			const [draggedValue] = newValues.splice(draggedIndex, 1);
			newValues.splice(hoveredIndex, 0, draggedValue);

			return newValues;
		});
	}, []);

	const updateValue = useCallback((text: string, id: number) => {
		setValues((prevValues) => {
			const newValues = [...prevValues];
			const index = newValues.findIndex((v) => v.id === id);

			if (index !== -1) {
				newValues[index] = { ...newValues[index], text };
			}

			return newValues;
		});
	}, []);

	const deleteValue = useCallback(
		(id: number) => {
			setValues((prevValues) => {
				const newValues = prevValues.filter((v) => v.id !== id);
				submitChanges(newValues);
				return newValues;
			});
		},
		[submitChanges],
	);

	const handleDragEnd = useCallback(() => {
		submitChanges(values);
	}, [values, submitChanges]);

	const handleInputBlur = useCallback(
		(text: string, id: number) => {
			updateValue(text, id);
			setValues((currentValues) => {
				const updatedValues = currentValues.map((v) => (v.id === id ? { ...v, text } : v));
				submitChanges(updatedValues);
				return updatedValues;
			});
		},
		[updateValue, submitChanges],
	);

	return (
		<div ref={(ref) => void drop(ref)} className="value-handler">
			{values?.length ? (
				values.map((value) => (
					<DragValue
						key={value.id}
						isActions={isActions}
						isEditable={isEditable}
						id={value.id}
						text={value.text}
						moveValue={moveValue}
						updateValue={updateValue}
						onDelete={deleteValue}
						onDragEnd={handleDragEnd}
						onInputBlur={handleInputBlur}
					/>
				))
			) : (
				<div className="empty-state">{t("properties.no-values")}</div>
			)}
		</div>
	);
};

export default ValueHandler;
