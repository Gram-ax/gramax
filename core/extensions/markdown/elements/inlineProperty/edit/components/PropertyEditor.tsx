import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { getInputComponent, getInputType, getPlaceholder, isManyProperty, PropertyTypes } from "@ext/properties/models";
import PropertyButton from "@ext/properties/components/PropertyButton";
import PropertyItem from "@ext/properties/components/PropertyItem";
import t from "@ext/localization/locale/translate";
import { KeyboardEvent, memo, MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { Instance, Props } from "tippy.js";
import useWatch from "@core-ui/hooks/useWatch";
import { ComponentType } from "react";

interface PropertyEditorProps {
	trigger: JSX.Element;
	id: string;
	type: PropertyTypes;
	values: string[];
	value: string[] | string | boolean;
	onSubmit: (propertyName: string, value: string, isDelete?: boolean) => void;
	customComponent?: ComponentType<any>;
	disabled?: boolean;
	canDelete?: boolean;
	isInline?: boolean;
}

const PropertyEditor = memo((props: PropertyEditorProps) => {
	const {
		disabled,
		trigger,
		id,
		onSubmit,
		isInline = false,
		canDelete = true,
		customComponent,
		value: initialValue,
		type,
		values,
	} = props;

	const instanceRef = useRef<Instance<Props>>(null);
	const [value, setValue] = useState<string[] | string | boolean>(initialValue);

	const InputComponent = customComponent ?? getInputComponent[type];

	useWatch(() => {
		setValue(initialValue);
	}, [initialValue]);

	const onClose = useCallback(
		(instance: Instance<Props>) => {
			if (!getInputType[type]) return;
			updateInput(id, instance);
		},
		[id, type],
	);

	const preSubmit = useCallback(
		(id: string, value: string, isDelete?: boolean) => {
			onSubmit(id, value, isDelete);
		},
		[onSubmit],
	);

	const handleClick = useCallback(
		(e: MouseEvent | KeyboardEvent, id: string, value: string) => {
			instanceRef.current?.hide();
			preSubmit(id, value);
		},
		[preSubmit],
	);

	const onKeyDown = useCallback(
		(e: KeyboardEvent, nid: string) => {
			const target = e.target as HTMLInputElement;
			if (e.code === "Enter" && target.value.length) handleClick(e, nid ?? id, target.value);
		},
		[handleClick, id],
	);

	const updateInput = useCallback(
		(id: string, instance: any) => {
			const currentValue = instance.popper.getElementsByTagName("input")[0].value;
			if (currentValue !== value?.[0]) {
				preSubmit(id, currentValue, currentValue.length === 0);
				instance.popper.getElementsByTagName("input")[0].value = "";
			}
		},
		[preSubmit, value],
	);

	const deleteProperty = useCallback(() => {
		preSubmit(id, undefined, true);
		const hasInput = InputComponent && instanceRef.current?.popper.getElementsByTagName("input")?.[0];
		if (hasInput) hasInput.value = "";
	}, [preSubmit, id, InputComponent]);

	const onTippyMount = useCallback((instance: Instance<Props>) => {
		instanceRef.current = instance;
	}, []);

	const buttons = useMemo(() => {
		return values?.map((val) => {
			const checked = Array.isArray(value) ? value.includes(val) : value === val;
			return (
				<PropertyButton
					canMany
					key={val}
					inputType={isManyProperty[type] ? "checkbox" : "radio"}
					name={val}
					checked={checked}
					onClick={(e) => handleClick(e, id, val)}
				/>
			);
		});
	}, [values, value, id, type]);

	return (
		<PopupMenuLayout
			isInline={isInline}
			offset={[0, 10]}
			onTippyMount={onTippyMount}
			appendTo={() => document.body}
			disabled={disabled}
			key={id}
			hideOnClick={false}
			onClose={onClose}
			trigger={trigger}
		>
			<>
				{InputComponent && (
					<InputComponent
						type={getInputType[type]}
						placeholder={t(getPlaceholder[type])}
						onKeyDown={onKeyDown}
						value={value}
						onChange={(e) => setValue(type === PropertyTypes.flag ? e.target?.checked : e.target?.value)}
						preSubmit={preSubmit}
						id={id}
						propertyType={type}
						values={values}
					/>
				)}
				{buttons}
				{(values?.length > 0 || InputComponent) && <div className="divider" />}
				{canDelete && <PropertyItem name={t("clear")} startIcon="eraser" onClick={deleteProperty} />}
			</>
		</PopupMenuLayout>
	);
});

export default PropertyEditor;
