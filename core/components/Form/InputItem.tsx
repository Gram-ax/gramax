import Tooltip from "@components/Atoms/Tooltip";
import { JSONSchema7 } from "json-schema";
import { MutableRefObject, useEffect, useRef } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Checkbox from "../Atoms/Checkbox";
import Input from "../Atoms/Input";
import ListLayout from "../List/ListLayout";
import Select from "../Select/Select";
import { Validate } from "./ValidateObject";

interface ItemInputProps {
	tabIndex: number;
	scheme: JSONSchema7;
	validate: Validate;
	value: string | string[] | boolean;
	onChange?: (value: string | string[] | boolean) => void;
	onFocus?: () => void;
	showErrorText?: boolean;
	focus?: boolean;
}

const ItemInput = (props: ItemInputProps) => {
	const { scheme, tabIndex, onChange, validate, showErrorText, onFocus, focus = false } = props;
	let { value } = props;

	const ref = useRef<HTMLElement>();

	useEffect(() => {
		if (!focus || !ref?.current) return;
		ref.current.focus();
	}, [focus]);

	if (scheme.enum) {
		return (
			<ListLayout
				tabIndex={tabIndex}
				errorText={validate}
				onFocus={onFocus}
				disable={scheme.readOnly ?? false}
				disableSearch={scheme.readOnly ?? false}
				items={(scheme.enum as string[]).map((v) => ({
					labelField: v,
					element: useLocalize(v as any),
				}))}
				item={{
					labelField: (value as string) ?? (scheme.default as string) ?? "",
					element: useLocalize(value as any) ?? (scheme.default ? useLocalize(scheme.default as any) : ""),
				}}
				onItemClick={(_, __, idx) => {
					onChange?.((scheme.enum as string[])[idx]);
				}}
				placeholder={useLocalize(scheme.format as any)}
			/>
		);
	}

	if (scheme.type === "array" && (scheme.items as JSONSchema7).type == "string") {
		return (
			<Tooltip content={validate}>
				<div>
					<Select
						create
						// disable={value.readOnly ?? false}
						placeholder={scheme.format}
						addPlaceholder={scheme.format ?? ""}
						createNewLabel={useLocalize("addValue") + " {search}"}
						values={(value as string[])?.map((value) => ({ value, label: value }))}
						options={[]}
						onChange={(values) => {
							value = values.map((value) => value.value);
							onChange?.(value);
						}}
						onFocus={onFocus}
					/>
				</div>
			</Tooltip>
		);
	}

	if (scheme.type === "boolean") {
		return (
			<Tooltip content={validate}>
				<div>
					<Checkbox
						interactive={true}
						disabled={scheme.readOnly}
						checked={(value ?? scheme.default) as boolean}
						onChange={(isChecked) => {
							value = isChecked;
							onChange?.(value);
						}}
					>
						<span className="control-label" dangerouslySetInnerHTML={{ __html: scheme?.title }} />
					</Checkbox>
				</div>
			</Tooltip>
		);
	}
	return (
		<Input
			isCode
			dataQa={(scheme as any).dataQa}
			disabled={scheme.readOnly}
			tabIndex={tabIndex}
			hidden={(scheme as any).private}
			ref={ref as MutableRefObject<HTMLInputElement>}
			errorText={validate}
			showErrorText={showErrorText}
			value={(value as string) ?? (scheme.default as string) ?? ""}
			onChange={(e) => {
				onChange?.(e.target.value);
			}}
			placeholder={scheme.format}
			onFocus={onFocus}
		/>
	);
};

export default ItemInput;
