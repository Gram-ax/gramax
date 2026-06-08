import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { CustomInputRenderer, getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";
import PropertiesScrollContainer from "@ext/properties/components/Helpers/PropertiesScrollContainer";
import getFormatValue from "@ext/properties/logic/getFormatValue";
import { isHasValue, type Property } from "@ext/properties/models";
import { Button } from "@ui-kit/Button";
import {
	DropdownMenuEmptyItem,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { MenuItemIcon, MenuItemIconButton } from "@ui-kit/MenuItem";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { type ReactNode, useCallback, useState } from "react";

export interface GetItemComponentArgs {
	key?: React.JSX.Element["key"];
	item: {
		property: Property;
		value?: string;
	};
	children?: ReactNode;
	disabled?: boolean;
	selected?: boolean | string[];
	onSelect?: (event: Event) => void;
}

export interface PropertyItemProps {
	property: Property;
	disabled: boolean;
	selected?: boolean | string[];
	onClick: (id: string, value?: string) => void;
	onDeleteClick?: (id: string) => void;
	onEditClick?: (id: string) => void;
	getItemComponent?: (args: GetItemComponentArgs) => ReactNode;
}

interface PropertyItemTriggerProps {
	property: Property;
	selected?: boolean | string[];
	isSubMenu?: boolean;
	onEditClick?: (id: string) => void;
}

const PropertyItemTrigger = ({ property, selected, isSubMenu, onEditClick }: PropertyItemTriggerProps) => {
	const isAssigned = typeof selected === "boolean" ? selected : selected?.length > 0;

	return (
		<div className="flex items-center w-full justify-between gap-4 overflow-hidden">
			<div className="flex items-center gap-2 min-w-0">
				{isSubMenu &&
					(isAssigned ? (
						<MenuItemIcon className="shrink-0" icon="check" />
					) : property.icon ? (
						<div className="w-4 h-4 shrink-0" />
					) : null)}
				{property.icon ? (
					<MenuItemIcon className="shrink-0" icon={property.icon} />
				) : (
					<div className="w-4 h-4 shrink-0" />
				)}
				<TextOverflowTooltip>{property.name}</TextOverflowTooltip>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{onEditClick && (
					<MenuItemIconButton
						icon="pen"
						onClick={(e) => {
							e.preventDefault();
							onEditClick(property.id);
						}}
					/>
				)}
				{!isSubMenu && <div style={{ width: "0.9rem", height: "1rem" }} />}
			</div>
		</div>
	);
};

const PropertyItem = (props: PropertyItemProps) => {
	let { property, selected, disabled, onClick, onDeleteClick, onEditClick, getItemComponent } = props;
	getItemComponent ??= getDefaultItemComponent;

	const [value, setValue] = useState<string>(property.value?.[0] ?? "");
	const InputComponent = getInputComponent(property.type);
	const isAssigned = typeof selected === "boolean" ? selected : selected?.length > 0;

	const isSubMenu = InputComponent || isHasValue[property.type];

	const onSelect = useCallback(
		(e: Event) => {
			if (isSubMenu) return;
			e.preventDefault();
			onClick(property.id);
		},
		[onClick, property?.id, isSubMenu],
	);

	const onSubItemSelect = useCallback(
		(value: string) => {
			onClick(property.id, value);
		},
		[onClick, property?.id],
	);

	const onAddClick = useCallback(() => {
		if (!value) return;
		onClick(property.id, value);
	}, [onClick, property?.id, value]);

	const onDelete = useCallback(() => {
		onDeleteClick?.(property.id);
	}, [onDeleteClick, property?.id]);

	const trigger = (
		<PropertyItemTrigger
			isSubMenu={!!isSubMenu}
			onEditClick={onEditClick}
			property={property}
			selected={selected}
		/>
	);

	const children = (
		<>
			{isSubMenu ? <DropdownMenuSubTrigger>{trigger}</DropdownMenuSubTrigger> : trigger}
			{isSubMenu && (
				<DropdownMenuSubContent>
					{!InputComponent && (
						<PropertiesScrollContainer>
							{!property.values?.length && (
								<DropdownMenuEmptyItem className="py-1.5">
									{t("properties.empty")}
								</DropdownMenuEmptyItem>
							)}
							{property.values?.map((value) =>
								getItemComponent({
									key: value,
									item: {
										property,
										value,
									},
									selected,
									children: [value],
									onSelect: (e) => {
										e.preventDefault();
										onSubItemSelect(value);
									},
								}),
							)}
						</PropertiesScrollContainer>
					)}
					{InputComponent && (
						<div>
							<CustomInputRenderer
								onChange={(value) => setValue(getFormatValue(value))}
								type={property.type}
								value={value}
							/>
							<Button
								className="w-full mt-2"
								disabled={!value?.length}
								onClick={onAddClick}
								size="xs"
								variant="ghost"
							>
								<Icon code="check" />
								{property.value?.[0] ? t("change") : t("add")}
							</Button>
							{onDeleteClick && isAssigned && (
								<Button className="w-full mt-1" onClick={onDelete} size="xs" variant="ghost">
									<Icon code="eraser" />
									{t("clear")}
								</Button>
							)}
						</div>
					)}
				</DropdownMenuSubContent>
			)}
		</>
	);

	if (!isSubMenu) {
		return getItemComponent({
			key: property.id,
			item: {
				property,
			},
			onSelect,
			disabled,
			selected,
			children,
		});
	}

	return <DropdownMenuSub key={property.id}>{children}</DropdownMenuSub>;
};

export default PropertyItem;

const getDefaultItemComponent: PropertyItemProps["getItemComponent"] = (props) => {
	const { disabled, key, onSelect, selected, children, item } = props;
	const isSelected = typeof selected === "boolean" ? selected : selected?.includes(item.value);
	return (
		<DropdownMenuItem disabled={disabled} key={key} onSelect={onSelect}>
			<div className="flex items-center gap-2 w-full">
				<div className="w-4 h-4 shrink-0">{isSelected && <MenuItemIcon icon="check" />}</div>
				<TextOverflowTooltip className="w-full">{children}</TextOverflowTooltip>
			</div>
		</DropdownMenuItem>
	);
};
