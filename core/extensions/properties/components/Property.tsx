import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { PropertyTypes } from "@ext/properties/models";
import { IconButton } from "@ui-kit/Button";
import { CSSProperties } from "react";

interface PropertyProps {
	name: string;
	type: PropertyTypes;
	value: string[] | string;
	propertyStyle?: string;
	icon?: string;
	style?: CSSProperties;
	shouldShowValue?: boolean | ((value: string[] | string) => boolean);
	onClear?: () => void;
	className?: string;
}

const Property = ({ type, name, value, className, style, icon, shouldShowValue = true, onClear }: PropertyProps) => {
	return (
		<Tooltip content={name}>
			<div className={className} style={style} data-qa="qa-property">
				{icon && <Icon className="prop-icon" code={icon} />}
				{shouldShowValue ? getDisplayValue(type, value) : name}
				{onClear ? <IconButton className="prop-x-mark" variant="text" size="xs" icon="x" onClick={() => onClear()} /> : null}
			</div>
		</Tooltip>
	);
};

export default styled(Property)`
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-radius: 9999px;
	user-select: none;
	cursor: pointer;
	font-size: 1em;
	line-height: normal;
	padding: 0.4em 0.65em;
	white-space: nowrap;
	border: ${(p) =>
		p.value
			? `1px solid var(--color-property-border-${p.propertyStyle})`
			: "1px solid var(--color-property-bg-border)"};
	background: ${(p) => (!p.propertyStyle ? "var(--color-code-bg)" : `var(--color-property-bg-${p.propertyStyle})`)};
	color: ${(p) => p.propertyStyle && `var(--color-property-text-${p.propertyStyle})`};

	:hover {
		filter: brightness(var(--filter-property));
	}

	.prop-icon {
		display: flex;
		font-size: 1.2em;
		margin-right: 0.25em;
	}

	.prop-x-mark {
		padding: 0;
		height: auto;
	}
`;
