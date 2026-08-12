import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { cn } from "@core-ui/utils/cn";
// biome-ignore lint/style/noRestrictedImports: idc
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { PropertyEditorProps } from "@ext/properties/components/Modals/PropertyEditor";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { useUpdateCatalogProperty } from "@ext/properties/logic/hooks/useUpdateCatalogProperty";
import { filterPropertyList } from "@ext/properties/logic/utils/filterPropertyList";
import type { Property, PropertyTypes } from "@ext/properties/models";
import TemplateService from "@ext/templates/components/TemplateService";
import { isComplexProperty } from "@ext/templates/models/properties";
import type { TemplateCustomProperty } from "@ext/templates/models/types";
import type { Editor } from "@tiptap/core";
import {
	DropdownEmpty,
	DropdownMenuItem,
	DropdownMenuSearchItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	useSearchableMenu,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItemIconButton, MenuItemText } from "@ui-kit/MenuItem";
import { useCallback, useMemo } from "react";

interface ButtonProps {
	buttonIcon: IconCode;
	properties: TemplateCustomProperty[];
	onAddNewProperty: (type: PropertyTypes, bind: string) => void;
	onEditClick: (item: Property) => void;
	onlyArticlePropertyTypes?: boolean;
	updateProperty: (property: Property, isDelete?: boolean, isArchive?: boolean) => void;
	onItemClick: (item: string) => void;
}

interface PropertyMenuGroupProps {
	editor?: Editor;
	isTemplate?: boolean;
}

const StyledDropdownMenuContent = styled(DropdownMenuSubContent)`
	width: min(90dvw, 12rem);
	max-height: min(45dvh, 20rem);
	overflow-y: auto;
	box-shadow: none;
`;

const Button = (props: ButtonProps) => {
	const {
		onItemClick,
		updateProperty,
		onAddNewProperty,
		buttonIcon,
		properties,
		onEditClick,
		onlyArticlePropertyTypes,
	} = props;

	const onClickAddNewProperty = useCallback(() => {
		ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
			properties,
			data: null,
			onlyArticlePropertyTypes,
			onSubmit: (property) => {
				onAddNewProperty(property.type, property.id);
				updateProperty(property);
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}, [onAddNewProperty, updateProperty, properties, onlyArticlePropertyTypes]);

	const { search, setSearch, contentRef, inputRef, handleContentKeyDown, handleInputKeyDown, filterItems } =
		useSearchableMenu();

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) setSearch("");
		},
		[setSearch],
	);

	const filteredProperties = useMemo(
		() => filterItems(properties.map((property) => ({ ...property, label: property.name }))),
		[properties, filterItems],
	);

	return (
		<DropdownMenuSub onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger>
				<Icon icon={buttonIcon} />
				{t("editor.property")}
			</DropdownMenuSubTrigger>
			<StyledDropdownMenuContent
				className={cn("rounded-lg lg:shadow-hard-base")}
				onKeyDown={handleContentKeyDown}
				ref={contentRef}
				sideOffset={8}
			>
				<DropdownMenuSearchItem
					onChange={(e) => setSearch(e.target.value)}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={handleInputKeyDown}
					placeholder={t("search.placeholder")}
					ref={inputRef}
					value={search}
				/>
				<DropdownMenuSeparator />
				<div className="flex-1" style={{ maxHeight: "11rem", overflowY: "auto" }}>
					{filteredProperties.length === 0 ? (
						<DropdownEmpty>{t("properties.no-properties")}</DropdownEmpty>
					) : (
						filteredProperties.map((property) => (
							<DropdownMenuItem
								key={property.label}
								onClick={() => onItemClick(property.id)}
								textValue={property.label}
							>
								<Icon icon={property.icon as IconCode} />
								<MenuItemText>{property.label}</MenuItemText>
								<MenuItemIconButton
									className="ml-auto"
									icon="pen"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onEditClick(property);
									}}
								/>
							</DropdownMenuItem>
						))
					)}
				</div>
				<div style={{ marginTop: "auto" }}>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={onClickAddNewProperty} textValue="add-property">
						<Icon icon="plus" />
						{t("properties.add")}
					</DropdownMenuItem>
				</div>
			</StyledDropdownMenuContent>
		</DropdownMenuSub>
	);
};

const PropertyMenuGroup = ({ editor }: PropertyMenuGroupProps) => {
	const { properties } = PropertyServiceProvider.value;
	const isInTemplate = !!TemplateService.value.selectedID;

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

	const saveCatalogProperties = useUpdateCatalogProperty({ canAdd: true });

	const onAddNewProperty = useCallback(
		(type: PropertyTypes, bind: string) => {
			if (isComplexProperty[type]) editor.commands.setBlockProperty({ bind });
			else editor.commands.setInlineProperty({ bind });
		},
		[editor],
	);

	const onEditClickHandler = useCallback(
		(property: TemplateCustomProperty) => {
			ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
				properties: Array.from(properties.values()),
				onlyArticlePropertyTypes: !isInTemplate,
				data: property,
				onDelete: (isArchive: boolean) => {
					saveCatalogProperties(property, true, isArchive);
					ModalToOpenService.resetValue();
				},
				onSubmit: (property) => {
					saveCatalogProperties(property);
					ModalToOpenService.resetValue();
				},
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		},
		[properties, saveCatalogProperties, isInTemplate],
	);

	const allProperties = useMemo(() => {
		const allProps = Array.from(properties.values());
		if (isInTemplate) return allProps;
		return allProps.filter((prop) => filterPropertyList(prop));
	}, [properties, isInTemplate]);

	return (
		<Button
			buttonIcon="variable"
			onAddNewProperty={onAddNewProperty}
			onEditClick={onEditClickHandler}
			onItemClick={onItemClick}
			onlyArticlePropertyTypes={!isInTemplate}
			properties={allProperties}
			updateProperty={saveCatalogProperties}
		/>
	);
};

export default PropertyMenuGroup;
