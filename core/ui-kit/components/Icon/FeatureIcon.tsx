import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { FC } from "react";
import { tv, VariantProps } from "tailwind-variants";

const featureIconVariants = tv({
	base: "flex items-center justify-center border border-secondary-border text-secondary-fg shadow-sm",
	variants: {
		size: {
			sm: "h-6 w-6 rounded-sm p-1.5",
			md: "h-8 w-8 rounded-md p-2",
			lg: "h-12 w-12 rounded-lg p-3",
		},
		type: {
			primary: "bg-primary-bg",
			secondary: "border-primary-border bg-secondary-bg",
		},
	},
	defaultVariants: {
		size: "md",
		type: "secondary",
	},
});

export type FeatureIconProps = VariantProps<typeof featureIconVariants> & {
	icon: string;
	className?: string;
};

export const FeatureIcon: FC<FeatureIconProps> = (props) => {
	const { icon, size, type, className } = props;
	const LucideIconComponent = LucideIcon(icon);

	return <LucideIconComponent className={featureIconVariants({ size, type, className })} />;
};
