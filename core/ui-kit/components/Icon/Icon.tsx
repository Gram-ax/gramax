import LucideIcon, { type IconCode, type LucideIconType } from "@components/Atoms/Icon/LucideIcon";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Icon as UiKitIcon } from "ics-ui-kit/components/icon";
import { forwardRef } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitIconProps = ExtractComponentGeneric<typeof UiKitIcon>;

export interface IconProps extends Omit<UiKitIconProps, "icon"> {
	icon: IconCode;
	color?: string;
}

const NonStyledIcon = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
	const { icon, color, ...otherProps } = props;
	const Icon = icon && typeof icon === "string" && LucideIcon(icon);
	if (!Icon) return null;

	return <UiKitIcon icon={Icon as LucideIconType} ref={ref} {...otherProps} />;
});

export const Icon = styled(NonStyledIcon)`
	${({ color }) =>
		color &&
		css`
		color: ${color};
	`}
`;
