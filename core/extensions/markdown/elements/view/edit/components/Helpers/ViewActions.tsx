import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import AddFilter from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Menu from "@ext/markdown/elements/view/edit/components/Helpers/Orderby/Menu";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import { isHasValue, Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";
import { Node } from "@tiptap/pm/model";
import { useCallback } from "react";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";

interface ViewActionsProps {
	node: Node;
	updateDisplay: (display: Display) => void;
	updateAttributes: (attributes: Record<string, any>) => void;
}

const ViewActions = ({ node, updateDisplay, updateAttributes }: ViewActionsProps) => {
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
				ignoreEmpty
				icon="filter"
				tooltipText={t("properties.view.filter")}
				attributeName="defs"
				properties={node.attrs.defs as PropertyValue[]}
				updateAttributes={updateAttributes}
				closeOnSelection={false}
			/>
			<AddFilter
				availableValues
				icon="arrow-down-a-z"
				tooltipText={t("properties.view.order-by")}
				attributeName="orderby"
				properties={node.attrs.orderby as PropertyValue[]}
				updateAttributes={updateAttributes}
				mode="multiple"
				allowSystemProperties={false}
				closeOnSelection={false}
				customPropertyMenu={(property, updateData) => {
					if (isHasValue[property.type] && !getInputComponent(property.type))
						return (
							<Menu
								name={property.name}
								data={
									getDataFromAttribute("orderby", property.name)?.value.filter((v) => v !== "none") ||
									property.values
								}
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
				availableValues={false}
				filter={propertyGroupFilter}
				mode={node.attrs.display === Display.Kanban ? "single" : "multiple"}
				allowSystemProperties={false}
			/>
			<AddFilter
				icon="list-checks"
				tooltipText={t("properties.view.select")}
				attributeName="select"
				properties={node.attrs.select as PropertyValue[]}
				updateAttributes={updateAttributes}
				availableValues={false}
				allowSystemProperties={false}
			/>
			<ViewButton icon="eye" tooltipText={t("properties.view.displays.name")}>
				<DropdownMenuRadioGroup value={displayType} onValueChange={updateDisplay} indicatorIconPosition="start">
					<DropdownMenuRadioItem value={Display.List}>
						<Icon code="list" />
						{t("properties.view.displays.list")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value={Display.Kanban}>
						<Icon code="square-kanban" />
						{t("properties.view.displays.kanban")}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value={Display.Table}>
						<Icon code="table" />
						{t("properties.view.displays.table")}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</ViewButton>
		</>
	);
};

export default ViewActions;
