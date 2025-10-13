import { CustomInputRenderer, getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";
import { DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuItem } from "@ui-kit/Dropdown";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import { Button } from "@ui-kit/Button";
import Icon from "@components/Atoms/Icon";
import { isHasValue, Property } from "@ext/properties/models";
import { useState } from "react";
import t from "@ext/localization/locale/translate";
import getFormatValue from "@ext/properties/logic/getFormatValue";

interface PropertyItemProps {
	property: Property;
	disabled: boolean;
	onClick: (name: string, value?: string) => void;
	onEditClick?: (name: string) => void;
}

const PropertyItem = ({ property, disabled, onClick, onEditClick }: PropertyItemProps) => {
	const [value, setValue] = useState<string>(property.value?.[0] ?? "");
	const InputComponent = getInputComponent(property.type);

	const isSubMenu = InputComponent || isHasValue[property.type];
	const MenuItem = isSubMenu ? DropdownMenuSub : DropdownMenuItem;

	const TriggerContent = (
		<div className="flex items-center w-full justify-between gap-4">
			<div className="flex items-center gap-2">
				{property.icon ? <Icon code={property.icon} /> : <div style={{ width: "1em", height: "1.1em" }} />}
				{property.name}
			</div>
			<div className="flex items-center gap-2">
				{onEditClick && (
					<MenuItemIconButton
						icon="pen"
						onClick={(e) => {
							e.preventDefault();
							onEditClick(property.name);
						}}
					/>
				)}
				{!isSubMenu && <div style={{ width: "1em", height: "1em" }} />}
			</div>
		</div>
	);

	const onSelect = (e: Event) => {
		if (isSubMenu) return;
		e.preventDefault();
		onClick(property.name);
	};

	const onSubItemSelect = (value: string) => {
		onClick(property.name, value);
	};

	const onAddClick = () => {
		if (!value) return;
		onClick(property.name, value);
	};

	return (
		<MenuItem key={property.name} onSelect={onSelect} disabled={disabled}>
			{isSubMenu ? <DropdownMenuSubTrigger>{TriggerContent}</DropdownMenuSubTrigger> : TriggerContent}
			{isSubMenu && (
				<DropdownMenuSubContent>
					{!InputComponent &&
						property.values?.map((value) => (
							<DropdownMenuItem
								key={value}
								onSelect={(e) => {
									e.preventDefault();
									onSubItemSelect(value);
								}}
							>
								{value}
							</DropdownMenuItem>
						))}
					{InputComponent && (
						<div>
							<CustomInputRenderer
								type={property.type}
								value={property.value?.[0]}
								onChange={(value) => setValue(getFormatValue(value))}
							/>
							<Button
								disabled={!value?.length}
								variant="ghost"
								size="xs"
								className="w-full mt-2"
								onClick={onAddClick}
							>
								<Icon code="check" />
								{t("add")}
							</Button>
						</div>
					)}
				</DropdownMenuSubContent>
			)}
		</MenuItem>
	);
};

export default PropertyItem;
