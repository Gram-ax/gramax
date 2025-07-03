import Tooltip from "@components/Atoms/Tooltip";
import type { FormSchema } from "@components/Form/Form";
import t, { hasTranslation } from "@ext/localization/locale/translate";
import { Property } from "@ext/properties/models";
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
	value: string | string[] | boolean | Property[];
	onChange?: (value: string | string[] | boolean | Property[]) => void;
	onFocus?: () => void;
	showErrorText?: boolean;
	focus?: boolean;
	dataQa?: string;
	isLoading?: boolean;
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
		dataQa,
		isLoading = false,
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
								? hasTranslation(`${translation}.${value as string}` as any)
									? t(`${translation}.${value as string}` as any)
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
				onCancelClick={() => {
					onChange?.("");
				}}
				placeholder={t(`forms.${form}.props.${translationKey}.placeholder`)}
				dataQa={dataQa}
			/>
		);
	}

	if (scheme.type === "array" && (scheme.items as JSONSchema7)?.type === "string") {
		return (
			<Tooltip content={validate}>
				<div>
					<Select
						create
						// disable={value.readOnly ?? false}
						placeholder={scheme.format ?? t(`forms.${form}.props.${translationKey}.placeholder`)}
						addPlaceholder={scheme.format ?? ""}
						createNewLabel={t("add-value") + " {search}"}
						values={(value as string[])?.map((value) => ({ value, label: value }))}
						options={[]}
						onChange={(values) => {
							value = values.map((value) => value.value);
							onChange?.(value);
						}}
						chevronView={false}
						onFocus={onFocus}
						dataQa={dataQa}
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
			dataQa={dataQa}
			disabled={scheme.readOnly}
			tabIndex={tabIndex}
			hidden={typeof (scheme as any).private !== "undefined"}
			ref={ref as MutableRefObject<HTMLInputElement>}
			errorText={validate}
			showErrorText={showErrorText}
			value={(value as string) ?? (scheme.default as string) ?? ""}
			onChange={(e) => {
				onChange?.(e.target.value);
			}}
			placeholder={t(`forms.${form}.props.${translationKey}.placeholder`)}
			onFocus={onFocus}
			isLoading={isLoading}
		/>
	);
};

export default ItemInput;
