import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import {
	getInputComponent,
	getInputType,
	getPlaceholder,
	isManyProperty,
	Property as PropertyType,
} from "@ext/properties/models";
import PropertyButton from "@ext/properties/components/PropertyButton";
import PropertyItem from "@ext/properties/components/PropertyItem";
import t from "@ext/localization/locale/translate";
import { KeyboardEvent, memo, MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { Instance, Props } from "tippy.js";
import useWatch from "@core-ui/hooks/useWatch";

interface PropertyArticleProps {
	trigger: JSX.Element;
	isReadOnly: boolean;
	property: PropertyType;
	onSubmit: (propertyName: string, value: string, isDelete?: boolean) => void;
}

const PropertyArticle = memo((props: PropertyArticleProps) => {
	const { isReadOnly, trigger, property, onSubmit } = props;

	const instanceRef = useRef<Instance<Props>>(null);
	const [value, setValue] = useState<string[] | string>(property.value);

	const InputComponent = getInputComponent[property.type];

	useWatch(() => {
		if (InputComponent) setValue(property.value?.[0] ?? "");
	}, [property.value]);

	const onClose = useCallback(
		(instance: Instance<Props>) => {
			if (!getInputType[property.type]) return;
			updateInput(property.name, instance);
		},
		[property.name],
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
		(e: KeyboardEvent, id: string) => {
			const target = e.target as HTMLInputElement;
			if (e.code === "Enter" && target.value.length) handleClick(e, id ?? property.name, target.value);
		},
		[handleClick, property.name],
	);

	const updateInput = useCallback(
		(id: string, instance: any) => {
			const currentValue = instance.popper.getElementsByTagName("input")[0].value;
			if (currentValue && currentValue !== value?.[0]) {
				preSubmit(id, currentValue);
				instance.popper.getElementsByTagName("input")[0].value = "";
			}
		},
		[preSubmit, value],
	);

	const deleteProperty = useCallback(() => preSubmit(property.name, undefined, true), [preSubmit, property.name]);

	const onTippyMount = useCallback((instance: Instance<Props>) => {
		instanceRef.current = instance;
	}, []);

	const buttons = useMemo(() => {
		return property?.values?.map((val) => {
			const checked = property.value?.includes(val);
			return (
				<PropertyButton
					canMany
					key={val}
					inputType={isManyProperty[property.type] ? "checkbox" : "radio"}
					name={val}
					checked={checked}
					onClick={(e) => handleClick(e, property.name, val)}
				/>
			);
		});
	}, [property.values, property.value]);

	return (
		<PopupMenuLayout
			offset={[0, 10]}
			onTippyMount={onTippyMount}
			appendTo={() => document.body}
			disabled={isReadOnly}
			key={property.name}
			hideOnClick={false}
			onClose={onClose}
			trigger={trigger}
		>
			<>
				{InputComponent && (
					<InputComponent
						type={getInputType[property.type]}
						placeholder={t(getPlaceholder[property.type])}
						onKeyDown={onKeyDown}
						value={value}
						onChange={(e) => setValue(e.target.value)}
					/>
				)}
				{buttons}
				{(property?.values?.length > 0 || InputComponent) && <div className="divider" />}
				<PropertyItem name={t("delete")} startIcon="trash" onClick={deleteProperty} />
			</>
		</PopupMenuLayout>
	);
});

export default PropertyArticle;
