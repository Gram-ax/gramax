import ContentEditable from "@components/Atoms/ContentEditable";
import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
// biome-ignore lint/style/noRestrictedImports: unable to fix this at now
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { NodeProperty } from "@ext/properties/components/Helpers/NodeProperty";
import type { PropertyID, PropertyValue } from "@ext/properties/models";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { ToggleGroupItem } from "@ui-kit/ToggleGroup";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { Fragment, useCallback, useRef, useState } from "react";

interface TabCaseProps {
	idx: number;
	name: string;
	icon?: IconCode;
	isEdit?: boolean;
	isPrint?: boolean;
	onClick?: (idx: number) => void;
	isActive?: boolean;
	className?: string;
	onNameUpdate?: (value: string, idx: number) => void;
	onRemoveClick?: (idx: number) => void;
	getTabProperties?: (index: number) => PropertyValue[];
	onPropertyAdd?: (index: number, property: PropertyID, value?: string) => void;
	onPropertyDelete?: (index: number, property: PropertyID) => void;
}

const TabCase = (props: TabCaseProps) => {
	const {
		className,
		name,
		icon,
		idx,
		isEdit,
		isPrint,
		isActive,
		onNameUpdate,
		onRemoveClick,
		onPropertyAdd,
		onPropertyDelete,
		getTabProperties,
	} = props;
	const [isEditing, setIsEditing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const nameRef = useRef<string>(name);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open && (!isActive || isEditing)) return;
			setIsOpen(open);
		},
		[isActive, isEditing],
	);

	const onEndInput = useCallback(() => {
		setIsEditing(false);
		onNameUpdate?.(nameRef.current, idx);
		nameRef.current = null;
	}, [onNameUpdate, idx]);

	const onNameChange = useCallback((value: string) => {
		nameRef.current = value;
	}, []);

	const Wrapper = isPrint ? Fragment : ToggleGroupItem;
	const wrapperProps = { className: "rounded-md", size: "sm", value: `${idx}` };

	const Trigger = (
		<div className={cn(className, "case", isActive && "active")} data-tab-index={idx}>
			<Wrapper {...wrapperProps}>
				{icon && <Icon icon={icon} />}
				{!isEditing && <TextOverflowTooltip>{name || t("article.no-name")}</TextOverflowTooltip>}
				{isEditing && (
					<ContentEditable
						autoFocus
						onBlur={onEndInput}
						onChange={onNameChange}
						onEnter={onEndInput}
						value={name}
					/>
				)}
			</Wrapper>
		</div>
	);

	if (!isEdit || isEditing) return Trigger;

	return (
		<DropdownMenu onOpenChange={onOpenChange} open={isOpen}>
			<DropdownMenuTrigger asChild>{Trigger}</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onSelect={() => setIsEditing(true)}>
					<Icon icon="pen" />
					{t("rename")}
				</DropdownMenuItem>
				<NodeProperty
					isSubMenu
					onDelete={(property: PropertyID) => onPropertyDelete?.(idx, property)}
					onSubmit={(property: PropertyID, value?: string) => onPropertyAdd(idx, property, value)}
					properties={getTabProperties?.(idx)}
					trigger={
						<>
							<Icon icon="tag" />
							{t("properties.name")}
						</>
					}
				/>
				<DropdownMenuItem onSelect={() => onRemoveClick?.(idx)} type="danger">
					<Icon icon="trash" />
					{t("delete")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default styled(TabCase)`
    white-space: nowrap;
	max-width: 100%;

	& > button, & > button > div {
		max-width: 100%;
	}

	[data-state="off"] {
		color: hsl(var(--muted));
	}

	[data-state="on"] {
		background-color: hsl(var(--secondary-bg-hover));
	}

	.read {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap !important;
		flex: 1;
	}

	.text {
		border-bottom: 2px #ffffff0f solid;
	}

	.tabs-action {
		flex-shrink: 0;
		visibility: hidden;
	}
`;
