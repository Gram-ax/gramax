import { JSONSchema7 } from "json-schema";
import { DependencyList, useEffect, useState } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Button from "../Atoms/Button/Button";
import Tooltip from "../Atoms/Tooltip";
import FormStyle from "./FormStyle";
import ItemInput from "./InputItem";
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
		onSubmit(editedProps);
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
			{Object.entries(editedSchema.properties).map(([key, value], idx) => {
				value = value as JSONSchema7;
				const isCheckbox = value.type == "boolean";
				if (typeof value === "string") {
					if (value === "separator") return <div className="separator" />;
					return <h3 key={idx}>{value}</h3>;
				}
				const requiredError = required.includes(key) && focusInput == idx && !editedProps[key];
				return (
					<div className="form-group" key={idx}>
						<div className={`field field-string ${fieldDirection}`}>
							{!isCheckbox && (
								<label className="control-label">
									<div style={{ display: "flex" }}>
										<span dangerouslySetInnerHTML={{ __html: value?.title }} />
										{required.includes(key) && <span className="required">*</span>}
									</div>
								</label>
							)}
							<Tooltip
								visible={requiredError || (!!validateValues[key] && focusInput == idx)}
								content={<span>{requiredError ? requiredParameterText : validateValues[key]}</span>}
							>
								<div className={`input-lable ${isCheckbox ? "checkbox" : ""}`}>
									<ItemInput
										value={value}
										tabIndex={idx + 1}
										focus={idx == 0}
										validate={validateValues[key]}
										editedPropsValue={editedProps[key]}
										onChange={(value: string | string[]) => {
											const newProps = { ...editedProps, ...{ [key]: value } };
											setEditedProps(newProps);
											if (onChange) onChange(newProps, editedSchema);
										}}
										onFocus={() => setFocusInput(idx)}
									/>
								</div>
							</Tooltip>
						</div>
						{value.description && (
							<div className={`input-lable-description ${isCheckbox ? "checkbox" : ""}`}>
								{!isCheckbox && <div />}
								<div className="article" dangerouslySetInnerHTML={{ __html: value.description }} />
							</div>
						)}
					</div>
				);
			})}
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
		<FormStyle padding={padding} overflow={overflow}>
			{formControl}
		</FormStyle>
	) : (
		formControl
	);
};

export default Form;
