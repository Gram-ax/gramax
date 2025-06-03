import ButtonsLayout from "@components/Layouts/ButtonLayout";
import TooltipListLayout from "@components/List/TooltipListLayout";
import t from "@ext/localization/locale/translate";
import TemplateService from "@ext/templates/components/TemplateService";
import { Editor } from "@tiptap/core";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { Divider } from "@mui/material";
import LinkItemSidebar from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import { TemplateCustomProperty } from "@ext/templates/models/types";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { combineCustomProperties } from "@ext/templates/logic/utils";
import FetchService from "@core-ui/ApiServices/FetchService";
import { PropertySettingsProps } from "@ext/templates/components/Properties/PropertySettings";
import { isComplexProperty } from "@ext/templates/models/properties";
import { ItemContent } from "@components/List/Item";
import { useCallback, useMemo } from "react";
import { PropertyTypes } from "@ext/properties/models";
import Sidebar from "@components/Layouts/Sidebar";
import Icon from "@components/Atoms/Icon";

interface ButtonProps {
	buttonIcon: string;
	items: ItemContent[];
	saveCustomProperty: (property: TemplateCustomProperty) => void;
	onAddNewProperty: (type: PropertyTypes, bind: string) => void;
	onItemClick: (item: string) => void;
	properties: TemplateCustomProperty[];
}

const Button = ({ items, onItemClick, onAddNewProperty, saveCustomProperty, buttonIcon, properties }: ButtonProps) => {
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
				ModalToOpenService.setValue<PropertySettingsProps>(ModalToOpen.TemplatePropertySettings, {
					properties,
					property: null,
					onSubmit: (property: TemplateCustomProperty) => {
						saveCustomProperty(property);
						ModalToOpenService.resetValue();
						onAddNewProperty(property.type, property.name);
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
	const { properties, selectedID } = TemplateService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const saveCustomProperty = useCallback(
		async (property: TemplateCustomProperty) => {
			const url = apiUrlCreator.saveTemplateCustomProperty(selectedID);
			await FetchService.fetch(url, JSON.stringify(property));
			TemplateService.setProperties(combineCustomProperties([...properties.values(), property], properties));
		},
		[apiUrlCreator, selectedID, properties],
	);

	const deleteCustomProperty = useCallback(
		async (property: TemplateCustomProperty) => {
			const url = apiUrlCreator.deleteTemplateCustomProperty(selectedID, property.name);
			await FetchService.fetch(url, JSON.stringify(property));

			const newProperties = Array.from(properties.values()).filter((p) => p.name !== property.name);

			const newMap = new Map(newProperties.map((p) => [p.name, p]));
			TemplateService.setProperties(newMap);
		},
		[apiUrlCreator, selectedID, properties],
	);

	const onItemClick = useCallback(
		(item: string) => {
			if (item === "") return;

			const property = properties.get(item);
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
		[editor],
	);

	const onAddNewProperty = useCallback(
		(type: PropertyTypes, bind: string) => {
			if (isComplexProperty[type]) editor.commands.setBlockProperty({ bind });
			else editor.commands.setInlineProperty({ bind });
		},
		[editor],
	);

	const propertiesArray = useMemo(() => Array.from(properties.values()), [properties]);

	const onEditClickHandler = useCallback(
		(property: TemplateCustomProperty) => {
			ModalToOpenService.setValue<PropertySettingsProps>(ModalToOpen.TemplatePropertySettings, {
				properties: propertiesArray,
				property,
				onSubmit: (property: TemplateCustomProperty) => {
					saveCustomProperty(property);
					ModalToOpenService.resetValue();
				},
				onClose: () => {
					ModalToOpenService.resetValue();
				},
				onDelete: async (property: TemplateCustomProperty) => {
					if (await confirm(t("properties.delete-property-confirm"))) {
						deleteCustomProperty(property);
						ModalToOpenService.resetValue();
					}
				},
			});
		},
		[properties, propertiesArray, saveCustomProperty, onAddNewProperty, deleteCustomProperty],
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
				properties={propertiesArray}
				buttonIcon="rectangle-ellipsis"
				onItemClick={onItemClick}
				onAddNewProperty={onAddNewProperty}
				saveCustomProperty={saveCustomProperty}
				items={items}
			/>
		</ButtonsLayout>
	);
};

export default PropertyMenuGroup;
