import Tooltip from "@components/Atoms/Tooltip";
import type { FormSchema } from "@components/Form/Form";
import t, { hasTranslation } from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { MutableRefObject, useEffect, useRef } from "react";
import Checkbox from "../Atoms/Checkbox";
import Input from "../Atoms/Input";
import ListLayout from "../List/ListLayout";
import Select from "../Select/Select";
import { Validate } from "./ValidateObject";

interface ItemInputProps {
	tabIndex: number;
	scheme: FormSchema;
	validate: Validate;
	formTranslationKey: string;
	translationKey: string;
	value: string | string[] | boolean;
	onChange?: (value: string | string[] | boolean) => void;
	onFocus?: () => void;
	showErrorText?: boolean;
	focus?: boolean;
	dataQa?: string;
}

const ItemInput = (props: ItemInputProps) => {
	const {
		scheme,
		tabIndex,
		onChange,
		validate,
		showErrorText,
		onFocus,
		focus = false,
		formTranslationKey: form,
		translationKey,
	} = props;
	let { value } = props;

	const ref = useRef<HTMLElement>();

	useEffect(() => {
		if (!focus || !ref?.current) return;
		ref.current.focus();
	}, [focus]);

	const translation = scheme.see;

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
					element: translation ? t(`${translation}.${v}` as any) : v,
				}))}
				item={{
					labelField: (value as string) ?? (scheme.default as string) ?? "",
					element: (() => {
						if (translation) {
							return value
								? hasTranslation(`${translation}.${value}` as any)
									? t(`${translation}.${value}` as any)
									: value
								: hasTranslation(`${translation}.${scheme.default as string}` as any)
								? t(`${translation}.${scheme.default as string}` as any)
								: value;
						}

						return value ?? scheme.default;
					})(),
				}}
				onItemClick={(_, __, idx) => {
					onChange?.((scheme.enum as string[])[idx]);
				}}
				placeholder={t(`forms.${form}.props.${translationKey}.placeholder`)}
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
						createNewLabel={t("add-value") + " {search}"}
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
			dataQa={props.dataQa}
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
			placeholder={t(`forms.${form}.props.${translationKey}.placeholder`)}
			onFocus={onFocus}
		/>
	);
};

export default ItemInput;
