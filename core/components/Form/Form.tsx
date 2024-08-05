import Field from "@components/Form/Field";
import t, { hasTranslation } from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { DependencyList, useEffect, useState } from "react";
import Button from "../Atoms/Button/Button";
import FormStyle from "./FormStyle";
import ValidateObject from "./ValidateObject";

export type FormSchema = JSONSchema7 & { see?: string };

const Form = <Type,>({
	props,
	schema,
	leftButton,
	onSubmit,
	onChange,
	validate = () => ({}),
	onMount = () => {},
	onUnmount = () => {},
	validateDeps = [],
	padding,
	overflow,
	submitText,
	initStyles = true,
	disableSubmit: parentDisableSubmit,
	fieldDirection = "column",
	formDirection = "column",
}: {
	props: Type;
	schema: FormSchema;
	leftButton?: JSX.Element;
	onSubmit?: (props: Type) => void;
	onChange?: (props: Type, schema: FormSchema) => void;
	onMount?: (props: Type, schema: FormSchema) => void;
	onUnmount?: (props: Type, schema: FormSchema) => void;
	validate?: (props: Type) => ValidateObject | Promise<ValidateObject>;
	validateDeps?: DependencyList;
	submitText?: string;
	padding?: string;
	overflow?: boolean;
	initStyles?: boolean;
	disableSubmit?: boolean;
	fieldDirection?: "row" | "column";
	formDirection?: "row" | "column";
}) => {
	const [editedSchema, setEditedSchema] = useState<FormSchema>(schema);
	const [focusInput, setFocusInput] = useState(-1);
	const [editedProps, setEditedProps] = useState(props);
	const [submitDisabled, setSubmitDisabled] = useState(true);
	const [validateValues, setValidateValues] = useState<ValidateObject>({});
	const requiredParameterText = t("required-parameter");

	const getRequired = () => {
		if (!editedSchema?.required) return [];
		let required = editedSchema.required;
		Object.entries(editedSchema.properties as { [key: string]: FormSchema }).forEach(([key, value]) => {
			if (value.readOnly) required = required.filter((x) => x != key);
		});
		return required;
	};
	const required = getRequired();

	const onChangeProps = async () => {
		const validateValues = await validate(editedProps);
		setValidateValues(validateValues);
		const requiredError = !required.every((key) => {
			if (typeof editedProps[key] === "boolean") return true;
			return !!editedProps[key];
		});
		setSubmitDisabled(requiredError || Object.values(validateValues).some((v) => !!v));
	};

	const submit = () => {
		const props = {} as Type;
		Object.keys(editedSchema.properties).forEach((key) => (props[key] = editedProps[key]));
		if (submitDisabled) return;
		onSubmit?.(editedProps);
	};

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) submit();
	};

	useEffect(() => {
		setEditedProps(props);
	}, [props]);

	useEffect(() => {
		setEditedSchema(schema);
	}, [schema]);

	useEffect(() => {
		onChangeProps();
	}, [editedProps, ...validateDeps]);

	useEffect(() => {
		onMount(editedProps, editedSchema);
		return () => onUnmount(editedProps, editedSchema);
	}, []);

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		return () => document.removeEventListener("keydown", keydownHandler, false);
	});

	const translation = editedSchema.see;

	const formControl = (
		<>
			{hasTranslation(`forms.${translation}.name`) && (
				<legend dangerouslySetInnerHTML={{ __html: t(`forms.${translation}.name`) }} />
			)}
			{hasTranslation(`forms.${translation}.description`) && (
				<p className="description">{t(`forms.${translation}.description`)}</p>
			)}
			<fieldset>
				{Object.entries(editedSchema.properties).map(([key, value], idx) => {
					const requiredError = required.includes(key) && focusInput == idx && !editedProps[key];
					return (
						<Field
							key={idx}
							required={required.includes(key)}
							translationKey={key}
							formTranslationKey={translation}
							scheme={value as FormSchema}
							value={editedProps[key]}
							validate={requiredError ? requiredParameterText : validateValues[key]}
							tabIndex={idx + 1}
							onChange={(value: string | string[]) => {
								const newProps = { ...editedProps, ...{ [key]: value } };
								setEditedProps(newProps);
								if (onChange) onChange(newProps, editedSchema);
							}}
							onFocus={() => setFocusInput(idx)}
							isFocused={focusInput == idx}
							fieldDirection={fieldDirection}
						/>
					);
				})}
			</fieldset>
			{onSubmit && (
				<div className="buttons">
					{leftButton && <div className="left-buttons">{leftButton}</div>}
					<Button onClick={submit} disabled={submitDisabled || parentDisableSubmit}>
						{submitText ?? t("save")}
					</Button>
				</div>
			)}
		</>
	);
	return initStyles ? (
		<FormStyle padding={padding} overflow={overflow} formDirection={formDirection}>
			{formControl}
		</FormStyle>
	) : (
		formControl
	);
};

export default Form;
