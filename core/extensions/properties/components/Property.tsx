import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import type { PropertyTypes } from "@ext/properties/models";
import { Tag } from "@ui-kit/Tag";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { CSSProperties } from "react";

interface PropertyProps {
	name: string;
	type: PropertyTypes;
	value: string[] | string;
	propertyStyle?: string;
	icon?: string;
	style?: CSSProperties;
	shouldShowValue?: boolean | ((value: string[] | string) => boolean);
	size?: "sm" | "md" | "lg";
	onClear?: () => void;
	displayName?: boolean;
	className?: string;
}

const Property = (props: PropertyProps) => {
	const {
		type,
		name,
		value,
		className,
		style,
		icon,
		shouldShowValue = true,
		onClear,
		size = "sm",
		displayName,
	} = props;

	const displayValue = displayName ? `${name}: ${getDisplayValue(type, value)}` : getDisplayValue(type, value);
	const tag = (
		<div className="block min-w-0 max-w-full">
			<Tag
				buttonClassName="min-w-0 max-w-full w-full justify-start overflow-hidden"
				className={cn(className, "transition-all min-w-0 max-w-full w-full")}
				data-testid="property-tag"
				onClose={onClear}
				size={size}
				startIcon={icon}
				style={style}
				type="button"
			>
				<span className="min-w-0 flex-1 truncate text-left">{shouldShowValue ? displayValue : name}</span>
			</Tag>
		</div>
	);

	if (displayName) return tag;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{tag}</TooltipTrigger>
			<TooltipContent>{name}</TooltipContent>
		</Tooltip>
	);
};

export default styled(Property)`
	button {
		border: ${(p) =>
			p.propertyStyle
				? `1px solid var(--color-property-border-${p.propertyStyle})`
				: "1px solid var(--color-property-bg-border)"};
		background-color: ${(p) => (p.propertyStyle ? `var(--color-property-bg-${p.propertyStyle})` : `var(--color-property-bg-border)`)};
		color: ${(p) => p.propertyStyle && `var(--color-property-text-${p.propertyStyle})`};
	}

	${(p) =>
		p.onClear &&
		`
		> button:first-of-type {
			border-right-width: 0px;
		}

		> button:last-of-type {
			border-left-width: 0px;
		}
	`}

	> div:first-of-type {
		border-color: ${(p) => (p.propertyStyle ? `var(--color-property-border-${p.propertyStyle})` : "var(--color-property-bg-border)")};
	}

	button:hover {
		filter: brightness(var(--filter-property));
		background-color: ${(p) => (!p.propertyStyle ? "var(--color-code-bg)" : `var(--color-property-bg-${p.propertyStyle})`)};
	}
`;
