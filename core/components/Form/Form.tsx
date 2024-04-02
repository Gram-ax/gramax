import Field from "@components/Form/Field";
import { JSONSchema7 } from "json-schema";
import { DependencyList, useEffect, useState } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Button from "../Atoms/Button/Button";
import FormStyle from "./FormStyle";
import ValidateObject from "./ValidateObject";

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
	schema: JSONSchema7;
	leftButton?: JSX.Element;
	onSubmit?: (props: Type) => void;
	onChange?: (props: Type, schema: JSONSchema7) => void;
	onMount?: (props: Type, schema: JSONSchema7) => void;
	onUnmount?: (props: Type, schema: JSONSchema7) => void;
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
	const [editedSchema, setEditedSchema] = useState<JSONSchema7>(schema);
	const [focusInput, setFocusInput] = useState(-1);
	const [editedProps, setEditedProps] = useState(props);
	const [submitDisabled, setSubmitDisabled] = useState(true);
	const [validateValues, setValidateValues] = useState<ValidateObject>({});
	const requiredParameterText = useLocalize("requiredParameter");

	const getRequired = () => {
		if (!editedSchema?.required) return [];
		let required = editedSchema.required;
		Object.entries(editedSchema.properties as { [key: string]: JSONSchema7 }).forEach(([key, value]) => {
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

	const formControl = (
		<>
			{editedSchema.title && <legend dangerouslySetInnerHTML={{ __html: editedSchema.title }} />}
			{editedSchema.description && <p className="description">{editedSchema.description}</p>}
			<fieldset>
				{Object.entries(editedSchema.properties).map(([key, value], idx) => {
					const requiredError = required.includes(key) && focusInput == idx && !editedProps[key];
					return (
						<Field
							key={idx}
							required={required.includes(key)}
							scheme={value as JSONSchema7}
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
						{submitText ?? useLocalize("save")}
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
