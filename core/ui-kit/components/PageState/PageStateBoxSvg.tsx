import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { PageStateBoxSvg as UiKitPageStateBoxSvg } from "ics-ui-kit/components/page-state";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitPageStateBoxSvgProps = ExtractComponentGeneric<typeof UiKitPageStateBoxSvg>;

interface PageStateBoxSvgProps extends Omit<UiKitPageStateBoxSvgProps, "icon"> {
	icon?: string;
}

export const PageStateBoxSvg: FC<PageStateBoxSvgProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitPageStateBoxSvg {...otherProps} icon={Icon as any} />;
};
