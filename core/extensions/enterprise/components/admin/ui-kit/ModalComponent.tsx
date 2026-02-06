import { ButtonProps } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalFooterTemplate, ModalHeaderTemplate, ModalTrigger } from "@ui-kit/Modal";

interface ModalComponentProps {
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	modalContent?: React.ReactNode;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	confirmButtonText?: React.ReactNode;
	cancelButtonText?: React.ReactNode;
	confirmButtonProps?: ButtonProps;
	cancelButtonProps?: ButtonProps;
	modalContentClassName?: string;
}

export const ModalComponent = ({
	isOpen,
	onOpenChange,
	modalContent,
	trigger,
	description,
	title,
	cancelButtonText,
	confirmButtonText,
	confirmButtonProps,
	cancelButtonProps,
	modalContentClassName,
}: ModalComponentProps) => {
	return (
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent className={modalContentClassName}>
				{(title || description) && (
					<ModalHeaderTemplate className="pb-0 lg:pb-0 border-b-0" description={description} title={title} />
				)}
				{modalContent && <ModalBody>{modalContent}</ModalBody>}
				{(confirmButtonText || cancelButtonText) && (
					<ModalFooterTemplate
						className="pt-0 lg:pt-0 border-t-0"
						primaryButton={confirmButtonText}
						primaryButtonProps={confirmButtonProps as any}
						secondaryButton={cancelButtonText}
						secondaryButtonProps={cancelButtonProps as any}
					/>
				)}
			</ModalContent>
		</Modal>
	);
};
