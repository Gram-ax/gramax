import { FeatureIcon } from "@ui-kit/Icon";
import { ModalTitle, ModalDescription, ModalHeader } from "@ui-kit/Modal";
import { FC, HTMLAttributes, ReactNode } from "react";
import { tv, VariantProps } from "tailwind-variants";

const modalHeaderVariants = tv({
	slots: {
		header: "flex items-start",
		contentWrapper: "flex flex-col pr-9",
		icon: "flex-shrink-0",
	},
	variants: {
		alignment: {
			compact: {
				header: "flex-row",
			},
			left: {
				header: "flex-col",
			},
			center: {
				header: "flex-col items-center text-center",
			},
		},
	},
	defaultVariants: {
		alignment: "compact",
	},
});

type ModalHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> &
	VariantProps<typeof modalHeaderVariants> & {
		title?: ReactNode;
		description?: ReactNode;
		icon?: string;
	};

const Header: FC<ModalHeaderProps> = ({ className, icon, title, alignment, description, ...props }) => {
	const { header, contentWrapper, icon: iconClassName } = modalHeaderVariants({ alignment });

	return (
		<ModalHeader className={header({ class: className })} {...props}>
			<FeatureIcon size="lg" type="primary" icon={icon || "flower"} className={iconClassName()} />
			<div className={contentWrapper()}>
				{title && <ModalTitle>{title}</ModalTitle>}
				{description && <ModalDescription>{description}</ModalDescription>}
			</div>
		</ModalHeader>
	);
};

export default Header;
