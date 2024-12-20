import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import DragValue from "@ext/properties/components/Helpers/DragValue";
import { DragItems } from "@ext/properties/models/kanban";
import { useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import React from "react";

interface ValueHandlerProps {
	data: string[];
	isActions?: boolean;
	onChange?: (values: string[]) => void;
}

export type Value = {
	id: number;
	text: string;
};

const ValueHandler = ({ data, onChange, isActions = true }: ValueHandlerProps) => {
	const [values, setValues] = useState<Value[]>(
		(data && data?.map((value, index) => ({ id: index, text: value }))) || [],
	);
	const [, drop] = useDrop(() => ({ accept: DragItems.Value }));

	const filterValues = useCallback((values: string[]) => {
		return values.filter((value, index) => {
			if (index !== values.length - 1 && value.length > 0) return true;
			if (index === values.length - 1 && value.length === 0) return true;
			return value.length > 0;
		});
	}, []);

	useWatch(() => {
		if (data) setValues(filterValues(data).map((value, index) => ({ id: index, text: value })));
	}, [data]);

	const findValue = useCallback(
		(id: number) => {
			const value = values.find((c) => c.id === id);
			return {
				value,
				index: values.indexOf(value),
			};
		},
		[values],
	);

	const submit = useCallback(
		(values: Value[]) => {
			onChange?.(values.filter((v) => v.text.length).map((v) => v.text));
		},
		[onChange],
	);

	const moveValue = useCallback(
		(id: number, atIndex: number) => {
			const { value, index } = findValue(id);
			const newValues = [...values];
			newValues.splice(index, 1);
			newValues.splice(atIndex, 0, value);
			setValues(newValues);
		},
		[values, findValue],
	);

	const updateValue = useCallback(
		(text: string, id?: number) => {
			const newValues = [...values];
			const { index } = findValue(id);
			if (index === -1) newValues.push({ id: newValues.length, text });
			else newValues[index].text = text;

			setValues(newValues);
			submit(newValues);
		},
		[values, findValue, submit],
	);

	const endDrag = useCallback(() => {
		submit(values);
	}, [values, submit]);

	const deleteValue = useCallback(
		(id: number) => {
			const newValues = [...values.filter((v) => v.id !== id)];
			setValues(newValues);
			submit(newValues);
		},
		[values],
	);

	return (
		<div ref={(ref) => void drop(ref)} className="value-handler">
			{!values.length && <div className="empty-state">{t("properties.no-values")}</div>}
			{values?.map((value) => (
				<DragValue
					isActions={isActions}
					key={value.text}
					id={value.id}
					text={value.text}
					isEdit={value.text.length === 0}
					endDrag={endDrag}
					moveValue={moveValue}
					findValue={findValue}
					updateValue={updateValue}
					onDelete={deleteValue}
				/>
			))}
		</div>
	);
};

export default ValueHandler;
