import { JSONSchema7 } from "json-schema";
import { MutableRefObject, useEffect, useRef } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Checkbox from "../Atoms/Checkbox";
import Input from "../Atoms/Input";
import ListLayout from "../List/ListLayout";
import Select from "../Select/Select";
import { Validate } from "./ValidateObject";

const ItemInput = ({
	value,
	tabIndex,
	editedPropsValue,
	onChange,
	validate,
	onFocus,
	focus = false,
}: {
	tabIndex: number;
	value: JSONSchema7;
	validate: Validate;
	editedPropsValue: string | string[] | boolean;
	onChange: (value: string | string[] | boolean) => void;
	onFocus?: () => void;
	focus?: boolean;
}) => {
	const ref = useRef<HTMLElement>();

	useEffect(() => {
		if (!focus || !ref?.current) return;
		ref.current.focus();
	}, [focus]);

	if (value.enum) {
		return (
			<ListLayout
				tabIndex={tabIndex}
				isErrorValue={!!validate}
				onFocus={onFocus}
				disable={value.readOnly ?? false}
				disableSearch={value.readOnly ?? false}
				items={(value.enum as string[]).map((v) => ({
					labelField: v,
					element: useLocalize(v as any),
				}))}
				item={{
					labelField: (editedPropsValue as string) ?? (value.default as string) ?? "",
					element:
						useLocalize(editedPropsValue as any) ??
						(value.default ? useLocalize(value.default as any) : ""),
				}}
				onItemClick={onChange}
				onSearchClick={() => onChange(null)}
				placeholder={useLocalize(value.format as any)}
			/>
		);
	}

	if (value.type === "array" && (value.items as JSONSchema7).type == "string") {
		return (
			<Select
				create
				// disable={value.readOnly ?? false}
				placeholder={value.format}
				addPlaceholder={value.format ?? ""}
				createNewLabel={useLocalize("addValue") + " {search}"}
				values={(editedPropsValue as string[])?.map((value) => ({ value, label: value }))}
				options={[]}
				onChange={(values) => {
					editedPropsValue = values.map((value) => value.value);
					onChange(editedPropsValue);
				}}
				onFocus={onFocus}
			/>
		);
	}

	if (value.type === "boolean") {
		return (
			<Checkbox
				interactive={true}
				checked={(editedPropsValue ?? value.default) as boolean}
				onChange={(isChecked) => {
					editedPropsValue = isChecked;
					onChange(editedPropsValue);
				}}
			>
				<span className="control-label" dangerouslySetInnerHTML={{ __html: value?.title }} />
			</Checkbox>
		);
	}
	return (
		<Input
			isCode
			dataQa={(value as any).dataQa}
			disable={value.readOnly ?? false}
			tabIndex={tabIndex}
			hidden={(value as any).private}
			ref={ref as MutableRefObject<HTMLInputElement>}
			isInputInvalid={!!validate}
			value={(editedPropsValue as string) ?? (value.default as string) ?? ""}
			onChange={(e) => onChange(e.target.value)}
			placeholder={value.format}
			onFocus={onFocus}
		/>
	);
};

export default ItemInput;
