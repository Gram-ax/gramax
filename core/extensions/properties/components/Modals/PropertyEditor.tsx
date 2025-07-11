import Form, { FormSchema } from "@components/Form/Form";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { JSONSchema7 } from "json-schema";
import Schema from "@ext/properties/models/schemas/CatalogCreateProps.schema.json";
import { useMemo, useState } from "react";
import Field from "@components/Form/Field";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import t from "@ext/localization/locale/translate";
import { Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import CatalogCreateProps from "@ext/properties/models/schemas/CatalogCreateProps.schema";
import ActionWarning from "@ext/properties/components/Modals/ActionWarning";
import ListLayout from "@components/List/ListLayout";
import lucideIconList, { iconFilter, toListItem } from "@components/Atoms/Icon/lucideIconList";
import ValueHandler from "@ext/properties/components/Helpers/ValueHandler";
import { DndProvider } from "react-dnd";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import Icon from "@components/Atoms/Icon";

export interface PropertyEditorProps<T = Property> {
	data: Property;
	properties: PropertyValue[];
	onSubmit: (values: T, isDelete?: boolean, saveValue?: boolean) => void;
	onClose?: () => void;
}

const PropertyEditor = ({ properties, onSubmit, onClose, data }: PropertyEditorProps) => {
	const [isOpen, setIsOpen] = useState<boolean>(true);
	const [editProps, setEditProps] = useState(data || { name: "", type: null, values: null, icon: null });
	const [visibleWarning, setVisibleWarning] = useState<number>(undefined);
	const suchExists = t("properties.validation-errors.prop-creator");
	const editSchema = useMemo(() => ({ ...Schema }), []);

	const onChange = (props) => setEditProps(props);

	const submit = (isDelete: boolean = false, saveValue?: boolean) => {
		const cleanProps = Object.fromEntries(
			Object.entries(editProps).filter(([, value]) => value !== null),
		) as Property;
		onSubmit(cleanProps, isDelete, saveValue);
		if (isDelete) setVisibleWarning(undefined);
		onClose?.();
	};

	const onCloseWarning = () => setVisibleWarning(undefined);

	const validateName = (name: string) => {
		if (!name) return false;
		const lowerName = name.toLowerCase();
		if (lowerName.length < 2) return false;
		if (!data?.name?.length && properties.some((prop) => prop.name.toLowerCase() === lowerName)) return false;
		return true;
	};

	const addValue = () => {
		setEditProps((prevProps) => ({
			...prevProps,
			values: [...(prevProps.values || []), ""],
		}));
	};

	const shouldOpenConfirm = () => {
		if (!data?.values) return false;

		const shouldOpen =
			(data?.values && data?.values?.length < editProps.values.length) ||
			JSON.stringify(data.values) !== JSON.stringify(editProps.values);

		if (shouldOpen) setVisibleWarning(2);
		return shouldOpen;
	};

	const onCloseHandler = () => {
		onClose?.();
		setIsOpen(false);
	};

	return (
		<>
			<ModalLayout
				isOpen={isOpen}
				closeOnCmdEnter={false}
				onClose={onCloseHandler}
				confirmSaveAction={() => submit()}
				closeConfirm={() => setVisibleWarning(undefined)}
				forceCloseConfirm={onCloseHandler}
				confirmTitle={t("unsaved-changes")}
				confirmText={t("modal.confirm.warning-have-changes")}
				isOpenConfirm={visibleWarning === 2}
				shouldOpenConfirmOnClose={shouldOpenConfirm}
			>
				<ModalLayoutLight>
					<Form<CatalogCreateProps>
						schema={editSchema as JSONSchema7}
						props={editProps}
						fieldDirection="row"
						leftButton={
							data && (
								<Button
									buttonStyle={ButtonStyle.underline}
									onClick={() => setVisibleWarning(1)}
									style={{ margin: "0px" }}
								>
									{t("delete")}
								</Button>
							)
						}
						onChange={onChange}
						validate={({ name }) => ({
							name: validateName(name) ? null : suchExists,
						})}
						onSubmit={() =>
							data?.values &&
							data?.values?.length > editProps?.values?.length &&
							JSON.stringify(data?.values) !== JSON.stringify(editProps?.values)
								? setVisibleWarning(0)
								: submit()
						}
						onMount={(_, schema) => {
							schema.properties = {
								name: Schema.properties.name,
								type: Schema.properties.type,
								style: Schema.properties.style,
							} as any;
							(schema.properties.type as any).readOnly = !!editProps.type;
							(schema.properties.name as any).readOnly = !!editProps.name;
						}}
					>
						<>
							<Field
								translationKey={"icon"}
								formTranslationKey={"catalog-create-props"}
								scheme={Schema.properties.icon as FormSchema}
								value={editProps?.icon}
								tabIndex={5}
								input={
									<ListLayout
										placeholder={t("icon")}
										items={lucideIconList}
										filterItems={iconFilter([], true)}
										item={toListItem({ code: editProps.icon ?? "" })}
										onItemClick={(value) => {
											editProps.icon = value;
											setEditProps({ ...editProps });
										}}
									/>
								}
								onChange={(values: string[]) => {
									const newProps = { ...editProps, values };
									setEditProps(newProps);
								}}
							/>
							{(editProps?.type === PropertyTypes.enum || editProps?.type === PropertyTypes.many) && (
								<Field
									translationKey={"values"}
									fieldDirection="column"
									formTranslationKey={"catalog-create-props"}
									scheme={Schema.properties.values as FormSchema}
									actionButtons={
										<Icon
											code="plus"
											isAction
											tooltipContent={t("add")}
											dataQa="qa-add-value"
											onClick={addValue}
										/>
									}
									input={
										<DndProvider backend={ModifiedBackend}>
											<div className="tree-root">
												<ValueHandler
													data={editProps.values}
													onChange={(values) => setEditProps({ ...editProps, values })}
												/>
											</div>
										</DndProvider>
									}
									value={editProps?.values}
									tabIndex={5}
									onChange={(values: string[]) => {
										const newProps = { ...editProps, values };
										setEditProps(newProps);
									}}
								/>
							)}
						</>
					</Form>
					{typeof visibleWarning !== "undefined" && visibleWarning < 2 && (
						<ActionWarning
							action={(saveValue?: boolean) => submit(visibleWarning === 1, saveValue)}
							isCatalog={visibleWarning === 1}
							onClose={onCloseWarning}
							data={data}
							editData={editProps}
							isOpen={true}
						/>
					)}
				</ModalLayoutLight>
			</ModalLayout>
		</>
	);
};

export default PropertyEditor;
