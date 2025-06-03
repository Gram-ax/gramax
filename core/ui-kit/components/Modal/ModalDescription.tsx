import { FC, HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const modalDescriptionStyles = tv({
	base: "font-sans text-sm font-normal leading-normal tracking-tight text-muted",
});

export const ModalDescription: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
	return <div className={modalDescriptionStyles({ class: className })} {...props} />;
};
