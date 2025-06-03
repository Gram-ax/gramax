import { FC, ReactNode } from "react";
import { tv } from "tailwind-variants";
import { ModalFooter } from "@ui-kit/Modal";

const modalFooterVariants = tv({
	slots: {
		container: "flex w-full flex-col gap-3 lg:flex-row",
		endBlock: "ml-auto flex w-full flex-col gap-3 lg:w-auto lg:flex-row-reverse",
	},
});

interface ModalFooterProps {
	className?: string;
	primaryButton?: ReactNode;
	secondaryButton?: ReactNode;
	leftButton?: ReactNode;
}

const Footer: FC<ModalFooterProps> = (props) => {
	const { primaryButton, secondaryButton, leftButton, className } = props;
	const { container, endBlock } = modalFooterVariants();

	return (
		<ModalFooter className={className}>
			<div className={container()}>
				{leftButton && leftButton}
				<div className={endBlock()}>
					{primaryButton}
					{secondaryButton}
				</div>
			</div>
		</ModalFooter>
	);
};

export default Footer;
