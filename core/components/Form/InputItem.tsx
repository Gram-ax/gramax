import Tooltip from "@components/Atoms/Tooltip";
import type { FormSchema } from "@components/Form/Form";
import t, { hasTranslation } from "@ext/localization/locale/translate";
import ArrayItems from "@ext/properties/components/ArrayItems";
import CatalogEditProperty from "@ext/properties/components/Modals/CatalogEditProperty";
import { Property } from "@ext/properties/models";
import { JSONSchema7 } from "json-schema";
import { MutableRefObject, useEffect, useRef, useState } from "react";
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
	} = props;
	let { value } = props;

	const ref = useRef<HTMLElement>();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [editData, setEditData] = useState<Property>(null);

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

	if (scheme.type === "array" && (scheme.items as JSONSchema7)?.type === "object") {
		const change = (prop: Property, isDelete: boolean = false) => {
			const newProps = [...(value as Property[])];
			const index = (value as Property[]).findIndex((obj: Property) => obj.name === prop.name);
			if (index === -1) {
				newProps.push(prop);
				onChange?.(newProps);
				return;
			}

			if (isDelete) newProps.splice(index, 1);
			else newProps[index] = prop;
			onChange?.(newProps);
		};

		const toggleModal = (index?: number) => {
			if (index === undefined) {
				setIsOpen(false);
				setEditData(null);
				return;
			}

			setEditData(value?.[index]);
			setIsOpen(true);
		};

		return (
			<ArrayItems newIcon="plus" otherIcon="pencil" values={value as Property[]} onClick={toggleModal}>
				{isOpen && (
					<CatalogEditProperty data={editData} isOpen={isOpen} closeModal={toggleModal} onSubmit={change} />
				)}
			</ArrayItems>
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
