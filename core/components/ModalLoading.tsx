import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { Loader } from "@ui-kit/Loader";
import { useCallback, useState } from "react";

interface ModalLoadingProps {
	title?: string;
	onOpen?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
}

const ModalLoading = ({ title, onOpen, onClose }: ModalLoadingProps) => {
	const [isOpen, setIsOpen] = useState(true);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) onClose?.();
			else onOpen?.();
		},
		[onClose, onOpen],
	);

	const onEscapeKeyDown = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent onEscapeKeyDown={onEscapeKeyDown} showCloseButton={false}>
				{title && (
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
				)}
				<DialogBody>
					<Loader size="3xl" />
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};

export default ModalLoading;
