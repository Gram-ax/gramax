import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Button from "@components/Atoms/Button/Button";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { PropertyTypes } from "@ext/properties/models";
import Style from "@components/HomePage/Cards/model/Style";
import ListLayout from "@components/List/ListLayout";
import Schema from "@ext/properties/models/schemas/CatalogCreateProps.schema.json";
import t from "@ext/localization/locale/translate";
import { toListItem } from "@components/Atoms/Icon/lucideIconList";
import { iconFilter } from "@components/Atoms/Icon/lucideIconList";
import lucideIconList from "@components/Atoms/Icon/lucideIconList";
import { FormSchema } from "@components/Form/Form";
import Field from "@components/Form/Field";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import Icon from "@components/Atoms/Icon";
import { DndProvider } from "react-dnd";
import ValueHandler from "@ext/properties/components/Helpers/ValueHandler";
import { useMemo, useState } from "react";
import { TemplateCustomProperty } from "@ext/templates/models/types";

export interface PropertySettingsProps {
	property: TemplateCustomProperty;
	properties: TemplateCustomProperty[];
	onSubmit: (property: TemplateCustomProperty) => void;
	onDelete?: (property: TemplateCustomProperty) => void;
	onClose: () => void;
}

const PropertySettings = ({ onSubmit, onClose, property, properties, onDelete }: PropertySettingsProps) => {
	const [nameError, setNameError] = useState<string>(null);
	const [focus, setFocus] = useState<number>(-1);
	const [data, setData] = useState<TemplateCustomProperty>(
		property || ({ name: "", style: "", type: "", values: [] } as any),
	);
	const isEditProperty = property?.name?.length > 0;
	let idx = 1;

	const suchExists = (name: string) => {
		if (!name) return false;
		const lowerName = name.toLowerCase();
		if (lowerName.length < 2) return false;
		if (properties.some((prop) => prop.name.toLowerCase() === lowerName)) return false;
		return true;
	};

	const customSchema = useMemo(() => {
		const schema = structuredClone(Schema) as Record<string, any>;
		const blackList = ["Array", "InlineMd"];

		schema.properties.type.enum = schema.properties.type.enum.filter((prop) => !blackList.includes(prop));

		schema.properties.name.readOnly = !!property?.name;
		schema.properties.type.readOnly = !!property?.type;

		return schema;
	}, [property, isEditProperty]);

	const preSubmit = () => {
		onSubmit(data);
	};

	const clearFocus = () => {
		setFocus(-1);
	};

	return (
		<ModalLayout isOpen={true} onClose={onClose} closeOnCmdEnter={false}>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>
							<div className={"edit-css-legend"}>{t("forms.catalog-create-props.name")}</div>
						</legend>
						<fieldset>
							<Field
								translationKey={"name"}
								formTranslationKey={"catalog-create-props"}
								scheme={customSchema.properties.name as FormSchema}
								required
								isFocused={focus === 1}
								validate={nameError}
								onFocus={() => setFocus(1)}
								value={data.name}
								tabIndex={idx++}
								onChange={(value: string) => {
									setData({ ...data, name: value });

									const error = suchExists(value)
										? null
										: t("properties.validation-errors.prop-creator");

									setNameError(error);
								}}
							/>
							<Field
								translationKey={"type"}
								formTranslationKey={"catalog-create-props"}
								scheme={customSchema.properties.type as FormSchema}
								required
								value={data.type}
								isFocused={focus === idx}
								onFocus={clearFocus}
								tabIndex={idx++}
								onChange={(value: string) => {
									setData({ ...data, type: value as PropertyTypes });
								}}
							/>
							<Field
								translationKey={"style"}
								formTranslationKey={"catalog-create-props"}
								scheme={customSchema.properties.style as FormSchema}
								value={data.style}
								isFocused={focus === idx}
								onFocus={clearFocus}
								tabIndex={idx++}
								onChange={(value: string) => {
									setData({ ...data, style: value as Style });
								}}
							/>
							<Field
								translationKey={"icon"}
								formTranslationKey={"catalog-create-props"}
								scheme={customSchema.properties.icon as FormSchema}
								value={data.icon}
								isFocused={focus === idx}
								onFocus={clearFocus}
								tabIndex={idx++}
								input={
									<ListLayout
										placeholder={t("icon")}
										items={lucideIconList}
										filterItems={iconFilter([], true)}
										item={toListItem({ code: data.icon })}
										onItemClick={(value) => {
											setData({ ...data, icon: value });
										}}
									/>
								}
								onChange={(value: string) => {
									setData({ ...data, icon: value });
								}}
							/>
							{(data.type === PropertyTypes.enum || data.type === PropertyTypes.many) && (
								<Field
									translationKey={"values"}
									fieldDirection="column"
									formTranslationKey={"catalog-create-props"}
									scheme={customSchema.properties.values as FormSchema}
									actionButtons={
										<Icon
											code="plus"
											isAction
											tooltipContent={t("add")}
											dataQa="qa-add-value"
											onClick={() => {
												setData({ ...data, values: [...data.values, ""] });
											}}
										/>
									}
									input={
										<DndProvider backend={ModifiedBackend}>
											<div className="tree-root">
												<ValueHandler
													data={data.values}
													onChange={(values) => setData({ ...data, values })}
												/>
											</div>
										</DndProvider>
									}
									value={data?.values}
									isFocused={focus === idx}
									onFocus={clearFocus}
									tabIndex={idx++}
									onChange={(values: string[]) => {
										setData({ ...data, values });
									}}
								/>
							)}
						</fieldset>
						<div className="buttons">
							{property && (
								<div className="left-buttons">
									<Button buttonStyle={ButtonStyle.underline} onClick={() => onDelete(property)}>
										{t("delete")}
									</Button>
								</div>
							)}

							<Button buttonStyle={ButtonStyle.transparent} onClick={onClose}>
								{t("cancel")}
							</Button>
							<Button buttonStyle={ButtonStyle.default} onClick={preSubmit} disabled={!!nameError}>
								{t("save")}
							</Button>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PropertySettings;
