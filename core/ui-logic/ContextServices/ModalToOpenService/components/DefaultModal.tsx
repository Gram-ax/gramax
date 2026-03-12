import { Button, type ButtonProps } from "@ui-kit/Button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui-kit/Dialog";
import type { ReactElement } from "react";

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
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent>
				<DialogHeader className="lg:pb-1 pb-1">
					<DialogTitle className={modalStatusSettings[status].className}>{title}</DialogTitle>
					{!!description && <DialogDescription>{description}</DialogDescription>}
					<DialogClose />
				</DialogHeader>
				{!!content && <DialogBody>{content}</DialogBody>}
				<DialogFooter className="flex gap-2 px-4 pb-4 lg:px-6 lg:pb-6 justify-end">
					{!!secondaryButtonProps && <Button {...secondaryButtonProps}>{secondaryButtonProps.text}</Button>}
					{!!primaryButtonProps && (
						<Button {...primaryButtonProps} status={status}>
							{primaryButtonProps.text}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DefaultModal;
