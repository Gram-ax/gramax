import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { CustomInputRenderer, getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";
import getFormatValue from "@ext/properties/logic/getFormatValue";
import { isHasValue, Property } from "@ext/properties/models";
import { Button } from "@ui-kit/Button";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import { ReactNode, useState } from "react";

export interface GetItemComponentArgs {
	key?: React.JSX.Element["key"];
	item: {
		property: Property;
		value?: string;
	};
	children?: ReactNode;
	disabled?: boolean;
	onSelect?: (event: Event) => void;
}

export interface PropertyItemProps {
	property: Property;
	disabled: boolean;
	onClick: (name: string, value?: string) => void;
	onEditClick?: (name: string) => void;
	getItemComponent?: (args: GetItemComponentArgs) => ReactNode;
}

const PropertyItem = ({ property, disabled, onClick, onEditClick, getItemComponent }: PropertyItemProps) => {
	getItemComponent ??= getDefaultItemComponent;

	const [value, setValue] = useState<string>(property.value?.[0] ?? "");
	const InputComponent = getInputComponent(property.type);

	const isSubMenu = InputComponent || isHasValue[property.type];

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

	const children = (
		<>
			{isSubMenu ? <DropdownMenuSubTrigger>{TriggerContent}</DropdownMenuSubTrigger> : TriggerContent}
			{isSubMenu && (
				<DropdownMenuSubContent>
					{!InputComponent &&
						property.values?.map((value) =>
							getItemComponent({
								key: value,
								item: {
									property,
									value,
								},
								children: [value],
								onSelect: (e) => {
									e.preventDefault();
									onSubItemSelect(value);
								},
							}),
						)}
					{InputComponent && (
						<div>
							<CustomInputRenderer
								onChange={(value) => setValue(getFormatValue(value))}
								type={property.type}
								value={property.value?.[0]}
							/>
							<Button
								className="w-full mt-2"
								disabled={!value?.length}
								onClick={onAddClick}
								size="xs"
								variant="ghost"
							>
								<Icon code="check" />
								{t("add")}
							</Button>
						</div>
					)}
				</DropdownMenuSubContent>
			)}
		</>
	);

	if (!isSubMenu) {
		return getItemComponent({
			key: property.name,
			item: {
				property,
			},
			onSelect,
			disabled,
			children,
		});
	}

	return <DropdownMenuSub key={property.name}>{children}</DropdownMenuSub>;
};

export default PropertyItem;

const getDefaultItemComponent: PropertyItemProps["getItemComponent"] = ({ children, disabled, key, onSelect }) => (
	<DropdownMenuItem disabled={disabled} key={key} onSelect={onSelect}>
		{children}
	</DropdownMenuItem>
);
