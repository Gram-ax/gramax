import { FC, HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

const modalTitleStyles = tv({
	base: "font-sans text-lg font-semibold leading-normal tracking-tight text-primary-fg",
});

export const ModalTitle: FC<HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => {
	return <h2 className={modalTitleStyles({ class: className })} {...props} />;
};
