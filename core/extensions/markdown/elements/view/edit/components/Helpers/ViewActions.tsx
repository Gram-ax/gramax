import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import AddFilter from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Menu from "@ext/markdown/elements/view/edit/components/Helpers/Orderby/Menu";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import PropertyItem from "@ext/properties/components/PropertyItem";
import { getInputType, isHasValue, Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { Node } from "@tiptap/pm/model";
import { MouseEvent, useCallback } from "react";

interface ViewActionsProps {
	node: Node;
	catalogProps: ClientCatalogProps;
	updateDisplay: (e: MouseEvent, display: Display) => void;
	updateAttributes: (attributes: Record<string, any>) => void;
}

const ViewActions = ({ node, updateDisplay, updateAttributes, catalogProps }: ViewActionsProps) => {
	const displayType = node.attrs.display;

	const getDataFromAttribute = useCallback(
		(attribute: string, propertyName: string) => {
			return node.attrs[attribute]?.find(
				(attr) => (typeof attr === "string" && attr === propertyName) || attr.name === propertyName,
			);
		},
		[node.attrs],
	);

	const propertyGroupFilter = useCallback(
		(property: Property) => {
			if (displayType === Display.Kanban) {
				return property.type === PropertyTypes.enum || property.type === PropertyTypes.many;
			}

			return true;
		},
		[displayType],
	);

	return (
		<>
			<AddFilter
				specialValues
				icon="filter"
				tooltipText={t("properties.view.filter")}
				attributeName="defs"
				properties={node.attrs.defs as PropertyValue[]}
				updateAttributes={updateAttributes}
				catalogProps={catalogProps}
				closeOnSelection={false}
			/>
			<AddFilter
				allowAddAll
				availableValues
				icon="arrow-down-a-z"
				tooltipText={t("properties.view.order-by")}
				attributeName="orderby"
				properties={node.attrs.orderby as PropertyValue[]}
				updateAttributes={updateAttributes}
				catalogProps={catalogProps}
				oneValue={false}
				allowSystemProperties={false}
				closeOnSelection={false}
				customPropertyMenu={(property, updateData) => {
					if (isHasValue[property.type] && !getInputType[property.type])
						return (
							<Menu
								name={property.name}
								data={getDataFromAttribute("orderby", property.name)?.value || property.values}
								defaultData={property.values}
								updateData={updateData}
							/>
						);
				}}
			/>
			<AddFilter
				icon="list-tree"
				tooltipText={t("properties.view.group-by")}
				attributeName="groupby"
				properties={node.attrs.groupby as PropertyValue[]}
				updateAttributes={updateAttributes}
				catalogProps={catalogProps}
				availableValues={false}
				filter={propertyGroupFilter}
				oneValue={node.attrs.display === Display.Kanban}
				allowSystemProperties={false}
			/>
			<AddFilter
				icon="list-checks"
				tooltipText={t("properties.view.select")}
				attributeName="select"
				properties={node.attrs.select as PropertyValue[]}
				updateAttributes={updateAttributes}
				catalogProps={catalogProps}
				availableValues={false}
				allowSystemProperties={false}
			/>
			<ViewButton icon="eye" tooltipText={t("properties.view.displays.name")}>
				<PropertyItem
					id={Display.List}
					name={t("properties.view.displays.list")}
					startIcon="list"
					endIcon={displayType === Display.List && "check"}
					onClick={updateDisplay}
				/>
				<PropertyItem
					id={Display.Kanban}
					name={t("properties.view.displays.kanban")}
					startIcon="square-kanban"
					endIcon={displayType === Display.Kanban && "check"}
					onClick={updateDisplay}
				/>
				<PropertyItem
					id={Display.Table}
					name={t("properties.view.displays.table")}
					startIcon="table"
					endIcon={displayType === Display.Table && "check"}
					onClick={updateDisplay}
				/>
			</ViewButton>
		</>
	);
};

export default ViewActions;
