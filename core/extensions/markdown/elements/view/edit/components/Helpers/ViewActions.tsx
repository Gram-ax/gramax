import Icon from "@components/Atoms/Icon";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import AddFilter from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Menu from "@ext/markdown/elements/view/edit/components/Helpers/Orderby/Menu";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import { getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";
import { isHasValue, Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { Node } from "@tiptap/pm/model";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import { useCallback } from "react";

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
				attributeName="defs"
				closeOnSelection={false}
				icon="filter"
				ignoreEmpty
				properties={node.attrs.defs as PropertyValue[]}
				tooltipText={t("properties.view.filter")}
				updateAttributes={updateAttributes}
			/>
			<AddFilter
				allowSystemProperties={false}
				attributeName="orderby"
				availableValues
				closeOnSelection={false}
				customPropertyMenu={(property, updateData) => {
					if (isHasValue[property.type] && !getInputComponent(property.type))
						return (
							<Menu
								data={
									getDataFromAttribute("orderby", property.name)?.value.filter((v) => v !== "none") ||
									property.values
								}
								defaultData={property.values}
								name={property.name}
								updateData={updateData}
							/>
						);
				}}
				icon="arrow-down-a-z"
				mode="multiple"
				properties={node.attrs.orderby as PropertyValue[]}
				tooltipText={t("properties.view.order-by")}
				updateAttributes={updateAttributes}
			/>
			<AddFilter
				allowSystemProperties={false}
				attributeName="groupby"
				availableValues={false}
				filter={propertyGroupFilter}
				icon="list-tree"
				mode={node.attrs.display === Display.Kanban ? "single" : "multiple"}
				properties={node.attrs.groupby as PropertyValue[]}
				tooltipText={t("properties.view.group-by")}
				updateAttributes={updateAttributes}
			/>
			<AddFilter
				allowSystemProperties={false}
				attributeName="select"
				availableValues={false}
				icon="list-checks"
				properties={node.attrs.select as PropertyValue[]}
				tooltipText={t("properties.view.select")}
				updateAttributes={updateAttributes}
			/>
			<ViewButton icon="eye" tooltipText={t("properties.view.displays.name")}>
				<DropdownMenuRadioGroup indicatorIconPosition="start" onValueChange={updateDisplay} value={displayType}>
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
