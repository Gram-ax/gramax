import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { PageStateFolderSvg as UiKitPageStateFolderSvg } from "ics-ui-kit/components/page-state";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";

type UiKitPageStateFolderSvgProps = ExtractComponentGeneric<typeof UiKitPageStateFolderSvg>;

interface PageStateFolderSvgProps extends Omit<UiKitPageStateFolderSvgProps, "icon"> {
	icon?: string;
}

export const PageStateFolderSvg: FC<PageStateFolderSvgProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitPageStateFolderSvg {...otherProps} icon={Icon as any} />;
};
