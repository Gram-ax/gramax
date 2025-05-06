import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import DragValue from "@ext/properties/components/Helpers/DragValue";
import { DragItems } from "@ext/properties/models/kanban";
import { useState, useCallback } from "react";
import { useDrop } from "react-dnd";

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

	useWatch(() => {
		if (data) setValues(data.map((value, index) => ({ id: index, text: value })));
	}, [data]);

	const findValue = useCallback((id: number, values: Value[]) => {
		const value = values.find((c) => c.id === id);
		return {
			value,
			index: values.indexOf(value),
		};
	}, []);

	const submit = useCallback(
		(values: Value[]) => {
			onChange?.(values.filter((v) => v.text.length).map((v) => v.text));
		},
		[onChange],
	);

	const moveValue = useCallback(
		(id: number, atIndex: number) => {
			setValues((values) => {
				const { value, index } = findValue(id, values);
				const newValues = [...values];

				newValues.splice(index, 1);
				newValues.splice(atIndex, 0, value);

				submit(newValues);
				return newValues;
			});
		},
		[findValue, submit],
	);

	const updateValue = useCallback(
		(text: string, id?: number) => {
			setValues((values) => {
				const newValues = [...values];
				const { index } = findValue(id, newValues);
				if (index === -1) newValues.push({ id: newValues.length, text });
				else newValues[index].text = text;

				submit(newValues);
				return newValues;
			});
		},
		[findValue, submit],
	);

	const endDrag = useCallback(() => {
		submit(values);
	}, [values, submit]);

	const deleteValue = useCallback(
		(id: number) => {
			setValues((values) => {
				const newValues = values.filter((v) => v.id !== id);
				submit(newValues);

				return newValues;
			});
		},
		[submit],
	);

	return (
		<div ref={(ref) => void drop(ref)} className="value-handler">
			{values?.length ? (
				values.map((value) => (
					<DragValue
						isActions={isActions}
						key={value.text}
						id={value.id}
						text={value.text}
						endDrag={endDrag}
						moveValue={moveValue}
						updateValue={updateValue}
						onDelete={deleteValue}
					/>
				))
			) : (
				<div className="empty-state">{t("properties.no-values")}</div>
			)}
		</div>
	);
};

export default ValueHandler;
