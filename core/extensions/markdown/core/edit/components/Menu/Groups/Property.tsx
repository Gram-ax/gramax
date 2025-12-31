import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { TemplateCustomProperty } from "@ext/templates/models/types";
import { isComplexProperty } from "@ext/templates/models/properties";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Property, PropertyTypes } from "@ext/properties/models";
import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import { PropertyEditorProps } from "@ext/properties/components/Modals/PropertyEditor";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@ui-kit/Command";
import styled from "@emotion/styled";
import { cn } from "@core-ui/utils/cn";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useHoverDropdown } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const StyledCommand = styled(Command)`
	max-height: min(18.75rem, 60vh);
`;

interface ButtonProps {
	buttonIcon: string;
	properties: TemplateCustomProperty[];
	onAddNewProperty: (type: PropertyTypes, bind: string) => void;
	onEditClick: (item: Property) => void;
	updateProperty: (property: Property, isDelete?: boolean, isArchive?: boolean) => void;
	onItemClick: (item: string) => void;
}

const Button = (props: ButtonProps) => {
	const { onItemClick, updateProperty, onAddNewProperty, buttonIcon, properties, onEditClick } = props;
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const [listHeight, setListHeight] = useState<string>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const onClickAddNewProperty = useCallback(() => {
		ModalToOpenService.setValue<PropertyEditorProps>(ModalToOpen.PropertySettings, {
			properties,
			data: null,
			onSubmit: (property) => {
				onAddNewProperty(property.type, property.name);
				updateProperty(property);
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}, [onAddNewProperty, updateProperty, properties]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile],
	);

	useLayoutEffect(() => {
		if (listRef.current) {
			const height = listRef.current.offsetHeight;
			setListHeight(`${height}px`);
		}
	}, [listRef.current]);

	return (
		<ComponentVariantProvider variant="inverse">
			<div tabIndex={-1} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
				<Popover open={isOpen} onOpenChange={onOpenChange}>
					<PopoverTrigger asChild>
						<ToolbarToggleButton active={isOpen}>
							<ToolbarIcon icon={buttonIcon} />
						</ToolbarToggleButton>
					</PopoverTrigger>
					<PopoverContent
						side="top"
						sideOffset={-0.5}
						className="p-2 bg-transparent border-none"
						style={{
							maxWidth: "calc(min(12rem, var(--radix-popover-content-available-width, 100%)))",
							height: listHeight,
							maxHeight: listHeight,
							overflowY: "auto",
							boxShadow: "none",
						}}
					>
						<StyledCommand className={cn("rounded-lg lg:shadow-hard-base", isMobile && "mobile")}>
							{properties.length > 0 && <CommandInput placeholder={t("properties.find")} />}
							<CommandList>
								<CommandEmpty>{t("properties.no-properties")}</CommandEmpty>
								<CommandGroup style={{ maxHeight: "11rem" }} className="overflow-y-auto text-xs">
									{properties.map((item) => (
										<CommandItem
											key={item.name}
											value={item.name}
											onSelect={() => onItemClick(item.name)}
										>
											<div className="flex flex-row items-center gap-2 overflow-hidden">
												<Icon code={item.icon} />
												<TextOverflowTooltip className="truncate whitespace-nowrap ml-auto">
													{item.name}
												</TextOverflowTooltip>
											</div>
											<MenuItemIconButton
												icon="pen"
												data-qa="edit-property"
												className="ml-auto right-extensions"
												onPointerDown={(e) => {
													e.stopPropagation();
													e.preventDefault();
													onEditClick(item);
												}}
											/>
										</CommandItem>
									))}
								</CommandGroup>
								{properties.length > 0 && <CommandSeparator />}
								<div className="p-1">
									<CommandItem onSelect={onClickAddNewProperty}>
										<div className="flex items-center gap-2">
											<Icon code="plus" />
											{t("properties.add-property")}
										</div>
									</CommandItem>
								</div>
							</CommandList>
						</StyledCommand>
					</PopoverContent>
				</Popover>
			</div>
		</ComponentVariantProvider>
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

	return (
		<Button
			properties={Array.from(properties.values())}
			buttonIcon="rectangle-ellipsis"
			onItemClick={onItemClick}
			updateProperty={updateProperty}
			onAddNewProperty={onAddNewProperty}
			onEditClick={onEditClickHandler}
		/>
	);
};

export default PropertyMenuGroup;
