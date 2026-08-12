import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import t from "@ext/localization/locale/translate";
import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/logic/handlePasteMarkdown";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import type { Property, PropertyValue } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";
import {
	DropdownEmpty,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
	useSearchableMenu,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { useCallback, useMemo } from "react";

interface AddPropertyProps {
	properties: PropertyValue[];
	disabled?: boolean;
	onChange: (properties: PropertyValue[]) => void;
}

export const AddProperty = ({ properties, disabled, onChange }: AddPropertyProps) => {
	const { properties: catalogProperties } = PropertyServiceProvider.value;

	const filterProperties = useCallback((value: Property) => {
		return !isComplexProperty[value.type] && !isMarkdownText(value.value?.[0]);
	}, []);

	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	const filteredProperties = useMemo(
		() =>
			filterItems(
				Array.from(catalogProperties.values())
					.filter(filterProperties)
					.map((property) => ({
						...property,
						label: property.name,
						checked: properties.some((filter) => filter.id === property.id),
					})),
			),
		[catalogProperties, filterItems, filterProperties, properties],
	);

	const onCheckboxChange = useCallback(
		(property: Property) => {
			const newProperties = [...properties];
			const index = newProperties.findIndex((p) => p.id === property.id);
			if (index !== -1) onChange(newProperties.filter((p) => p.id !== property.id));
			else onChange([...properties, { id: property.id, value: [] }]);
		},
		[properties, onChange],
	);

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton
				className="ml-auto h-auto p-0"
				data-testid="catalog-view-add-property-trigger"
				disabled={disabled}
				size="sm"
				variant="text"
			>
				<Icon icon="plus" size="md" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent onKeyDown={handleContentKeyDown} ref={contentRef}>
				<DropdownMenuSearchItem
					onChange={(e) => setSearch(e.target.value)}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={handleInputKeyDown}
					placeholder={t("search.placeholder")}
					ref={inputRef}
					value={search}
				/>
				<DropdownMenuSeparator />
				{filteredProperties.map((property) => (
					<DropdownMenuCheckboxItem
						checked={property.checked}
						key={property.id}
						onSelect={() => onCheckboxChange(property)}
					>
						{property.icon ? <Icon icon={property.icon as IconCode} /> : <div className="w-4 h-4" />}
						{property.name}
					</DropdownMenuCheckboxItem>
				))}
				{!filteredProperties?.length && <DropdownEmpty>{t("properties.no-properties")}</DropdownEmpty>}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
