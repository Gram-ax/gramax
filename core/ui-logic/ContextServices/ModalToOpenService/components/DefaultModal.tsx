import { Button, ButtonProps } from "@ui-kit/Button";
import {
	Modal,
	ModalBody,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from "@ui-kit/Modal";
import { ReactElement } from "react";

type ModalButtonProps = {
	text: string;
} & ButtonProps;

export interface DefaultModalProps {
	title: string;
	content: ReactElement | string;
	isOpen?: boolean;
	status?: "default" | "warning" | "error";
	description?: string;
	primaryButtonProps: ModalButtonProps;
	secondaryButtonProps: ModalButtonProps;
	onClose?: () => void;
}

const modalStatusSettings: Record<DefaultModalProps["status"], { className: string }> = {
	default: { className: "" },
	warning: { className: "text-status-warning" },
	error: { className: "text-status-error" },
};

const DefaultModal = ({
	title,
	content,
	primaryButtonProps,
	secondaryButtonProps,
	description,
	isOpen = true,
	onClose,
	status = "default",
}: DefaultModalProps) => {
	const onOpenChange = (open: boolean) => {
		if (!open) onClose?.();
	};

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			<ModalContent>
				<ModalHeader className="lg:pb-1 pb-1">
					<ModalTitle className={modalStatusSettings[status].className}>{title}</ModalTitle>
					{!!description && <ModalDescription>{description}</ModalDescription>}
					<ModalClose />
				</ModalHeader>
				{!!content && <ModalBody>{content}</ModalBody>}
				<ModalFooter className="flex gap-2 px-4 pb-4 lg:px-6 lg:pb-6 justify-end">
					{!!secondaryButtonProps && <Button {...secondaryButtonProps}>{secondaryButtonProps.text}</Button>}
					{!!primaryButtonProps && (
						<Button {...primaryButtonProps} status={status}>
							{primaryButtonProps.text}
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default DefaultModal;
