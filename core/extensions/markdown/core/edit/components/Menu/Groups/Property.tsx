import Icon from "@components/Atoms/Icon";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Sidebar from "@components/Layouts/Sidebar";
import { ItemContent } from "@components/List/Item";
import TooltipListLayout from "@components/List/TooltipListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import LinkItemSidebar from "@ext/article/LinkCreator/components/LinkItemSidebar";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import t from "@ext/localization/locale/translate";
import { PropertyEditorProps } from "@ext/properties/components/Modals/PropertyEditor";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { Property, PropertyTypes } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";
import { TemplateCustomProperty } from "@ext/templates/models/types";
import { Divider } from "@mui/material";
import { Editor } from "@tiptap/core";
import { useCallback, useMemo } from "react";

interface ButtonProps {
	buttonIcon: string;
	items: ItemContent[];
	properties: TemplateCustomProperty[];
	onAddNewProperty: (type: PropertyTypes, bind: string) => void;
	updateProperty: (property: Property, isDelete?: boolean, isArchive?: boolean) => void;
	onItemClick: (item: string) => void;
}

const Button = ({ items, onItemClick, updateProperty, onAddNewProperty, buttonIcon, properties }: ButtonProps) => {
	const buttons = [
		{
			element: (
				<div style={{ width: "100%" }} data-qa="qa-clickable">
					<LinkItemSidebar title={t("properties.add-property")} iconCode={"plus"} />
					<Divider
						style={{
							background: "var(--color-edit-menu-button-active-bg)",
						}}
					/>
				</div>
			),
			labelField: "addNewProperty",
			onClick: () => {
				ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
					properties,
					data: null,
					onSubmit: (property) => {
						ModalToOpenService.resetValue();
						onAddNewProperty(property.type, property.name);
						updateProperty(property);
					},
					onClose: () => {
						ModalToOpenService.resetValue();
					},
				});
			},
		},
	];

	return (
		<TooltipListLayout
			buttonIcon={buttonIcon}
			buttons={buttons}
			items={items}
			onItemClick={onItemClick}
			tooltipText={`${t("find")} ${t("properties.name").toLowerCase()}`}
		/>
	);
};

const PropertyMenuGroup = ({ editor }: { editor?: Editor }) => {
	const { properties } = PropertyServiceProvider.value;
	const apiUrlCreator = ApiUrlCreator.value;
	const { data: catalogPropsData, update: updateCatalogProps } = useCatalogPropsStore((state) => state);
	const onItemClick = useCallback(
		(item: string) => {
			if (item === "") return;

			const property = properties.get(item);
			if (!property) return;

			editor
				.chain()
				.command(({ commands }) => {
					if (isComplexProperty[property.type]) commands.setBlockProperty({ bind: item });
					else commands.setInlineProperty({ bind: item });

					return true;
				})
				.focus(editor.state.selection.anchor)
				.run();
		},
		[editor, properties],
	);

	const onAddNewProperty = useCallback(
		(type: PropertyTypes, bind: string) => {
			if (isComplexProperty[type]) editor.commands.setBlockProperty({ bind });
			else editor.commands.setInlineProperty({ bind });
		},
		[editor],
	);

	const updateProperty = useCallback(
		async (property: Property, isDelete: boolean = false, isArchive: boolean = false) => {
			const newProps = getCatalogEditProps(catalogPropsData);
			const index = newProps.properties.findIndex((obj) => obj.name === property.name);

			ModalToOpenService.setValue(ModalToOpen.Loading);

			if (index === -1) newProps.properties = [...newProps.properties, property];
			else {
				if (isDelete) {
					newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
					if (!isArchive) await FetchService.fetch(apiUrlCreator.removePropertyFromArticles(property.name));
				} else {
					const deletedValues = isArchive
						? ""
						: newProps.properties?.[index]?.values
								?.filter((value) => !property.values.includes(value))
								.toString();

					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...property,
					};

					if (deletedValues && !isArchive) {
						await FetchService.fetch(
							apiUrlCreator.removePropertyFromArticles(property.name, deletedValues),
						);
					}
				}
			}

			ModalToOpenService.resetValue();
			FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify(newProps), MimeTypes.json);
			updateCatalogProps({ properties: newProps.properties });
		},
		[apiUrlCreator, catalogPropsData],
	);

	const onEditClickHandler = useCallback(
		(property: TemplateCustomProperty) => {
			ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
				properties: Array.from(properties.values()),
				data: property,
				onDelete: (isArchive: boolean) => {
					updateProperty(property, true, isArchive);
					ModalToOpenService.resetValue();
				},
				onSubmit: (property) => {
					updateProperty(property);
					ModalToOpenService.resetValue();
				},
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		},
		[properties, updateProperty],
	);

	const items = useMemo(() => {
		return Array.from(properties.entries()).map(([, value]) => {
			return {
				labelField: value.name,
				element: (
					<div style={{ width: "100%", padding: "5px 13px" }}>
						<Sidebar
							title={value.name}
							rightActions={[
								<Icon
									tooltipContent={t("edit2")}
									key={"pencil-snippet-" + value.name}
									code="pencil"
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										onEditClickHandler(value);
									}}
								/>,
							]}
						/>
					</div>
				),
				value: value.name,
			};
		});
	}, [properties]);

	return (
		<ButtonsLayout>
			<Button
				properties={Array.from(properties.values())}
				buttonIcon="rectangle-ellipsis"
				onItemClick={onItemClick}
				updateProperty={updateProperty}
				onAddNewProperty={onAddNewProperty}
				items={items}
			/>
		</ButtonsLayout>
	);
};

export default PropertyMenuGroup;
