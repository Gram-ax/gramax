import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { FeatureIcon as FeatureIconComponent } from "ics-ui-kit/components/icon";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

export type FeatureIconProps = Omit<ExtractComponentGeneric<typeof FeatureIconComponent>, "icon"> & {
	icon: string;
	className?: string;
};

export const FeatureIcon: FC<FeatureIconProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = LucideIcon(icon);
	if (!Icon) return null;
	return <FeatureIconComponent icon={Icon as any} {...otherProps} />;
};
