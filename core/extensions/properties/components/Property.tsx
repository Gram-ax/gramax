import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { PropertyTypes } from "@ext/properties/models";
import { CSSProperties, ReactNode } from "react";

interface PropertyProps {
	name: string;
	type: PropertyTypes;
	propertyStyle?: string;
	icon?: string;
	value?: string | ReactNode;
	style?: CSSProperties;
	className?: string;
}

const Property = ({ name, value, className, style, icon }: PropertyProps) => {
	return (
		<Tooltip content={name}>
			<div className={className} style={style} data-qa="qa-property">
				{value && (
					<span className="property-value">
						{icon && <Icon code={icon} />}
						{Array.isArray(value) ? value.join(", ") : value}
					</span>
				)}
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
	border: ${(p) =>
		p.value
			? `1px solid var(--color-property-border-${p.propertyStyle})`
			: "1px solid var(--color-property-bg-border)"};
	background: ${(p) => (p.value ? "var(--color-property-bg-main)" : `var(--color-property-bg-${p.propertyStyle})`)};
	color: ${(p) => p.propertyStyle && `var(--color-property-text-${p.propertyStyle})`};
	:hover {
		filter: brightness(var(--filter-property));
	}

	.property-value {
		display: flex;
		align-items: center;
		padding: 0.4em 0.65em;
		background: ${(p) =>
			!p.propertyStyle ? "var(--color-code-bg)" : `var(--color-property-bg-${p.propertyStyle})`};
		border-radius: 9999px;
		white-space: nowrap;

		i {
			display: flex;
			font-size: 1.2em;
			margin-right: 0.25em;
		}
	}
`;
