import { FC, ReactNode } from "react";
import { tv } from "tailwind-variants";

const formSectionTitle = tv({
	base: "text-sm leading-none font-medium text-primary-fg",
});

export interface FormItemTitleProps {
	children: ReactNode;
	className?: string;
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const FormItemTitle: FC<FormItemTitleProps> = ({ children, className, as: Component = "h3" }) => {
	return <Component className={formSectionTitle({ className })}>{children}</Component>;
};
