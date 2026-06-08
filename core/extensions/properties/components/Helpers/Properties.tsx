import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import PropertyComponent from "@ext/properties/components/Property";
import { shouldPropertyVisible } from "@ext/properties/logic/shouldPropertyVisible";
import { type Property, PropertyTypes } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { useCallback, useMemo } from "react";

export interface PropertiesProps {
	properties: Property[];
	catalogProperties: Map<string, Property>;
	trigger: JSX.Element;
	hideList?: boolean;
	isReadOnly?: boolean;
	isSubMenu?: boolean;
	onSubmit: (id: string, value: string) => void;
	onDelete?: (id: string) => void;
}

const Properties = (props: PropertiesProps) => {
	const { properties, catalogProperties, hideList, isReadOnly, isSubMenu, onSubmit, onDelete, trigger } = props;
	const filterProperties = useCallback(
		(value: Property) => {
			return (
				!isComplexProperty[value.type] &&
				!isMarkdownText(value.value?.[0]) &&
				shouldPropertyVisible(value, isReadOnly)
			);
		},
		[isReadOnly],
	);

	const articleRenderedProperties = useMemo(() => {
		return properties?.filter(filterProperties)?.map((property) => {
			const button = (
				<PropertyComponent
					icon={property.icon}
					name={property.name}
					propertyStyle={property.style}
					shouldShowValue={property.type !== PropertyTypes.flag}
					type={property.type}
					value={property.value?.length && property.value[0]?.length ? property.value : property.name}
				/>
			);

			if (isReadOnly) {
				return (
					<div className="min-w-0 max-w-full" key={property.id}>
						{button}
					</div>
				);
			}

			return (
				<PropertyArticle
					key={property.id}
					onDelete={onDelete}
					onSubmit={onSubmit}
					property={property}
					trigger={<div className="min-w-0 max-w-full">{button}</div>}
				/>
			);
		});
	}, [properties, onSubmit, onDelete, filterProperties, isReadOnly]);

	const DropdownmenuComponent = isSubMenu ? DropdownMenuSub : DropdownMenu;
	const DropdownmenuContentComponent = isSubMenu ? DropdownMenuSubContent : DropdownMenuContent;
	const DropdownmenuTriggerComponent = isSubMenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;

	return (
		<>
			{!isReadOnly && (
				<DropdownmenuComponent>
					<DropdownmenuTriggerComponent asChild={!isSubMenu}>{trigger}</DropdownmenuTriggerComponent>
					<DropdownmenuContentComponent style={{ maxWidth: "15rem", maxHeight: "max(45dvh, 30rem)" }}>
						<AddProperty
							canAdd
							catalogProperties={catalogProperties}
							onDelete={onDelete}
							onSubmit={onSubmit}
							properties={properties}
						/>
					</DropdownmenuContentComponent>
				</DropdownmenuComponent>
			)}
			{!hideList && <ArticlePropertyWrapper>{articleRenderedProperties}</ArticlePropertyWrapper>}
		</>
	);
};

export default Properties;
