import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPrimitiveAction,
	AlertDialogPrimitiveCancel,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import t from "@ext/localization/locale/translate";

interface ConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	onClose: () => void;
	title?: string;
	description?: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	discardText?: string;
	showDiscard?: boolean;
	isDestructive?: boolean;
}

export function ConfirmationDialog({
	isOpen,
	onOpenChange,
	onSave,
	onClose,
	title = t("confirmation.unsaved.title"),
	description = t("confirmation.unsaved.body"),
	confirmText = t("save-and-close"),
	cancelText = t("cancel"),
	discardText = t("dont-save"),
	showDiscard = true,
	isDestructive = false,
}: ConfirmationDialogProps) {
	const handleSaveAndClose = () => {
		onSave();
		onClose();
		onOpenChange(false);
	};

	const handleDiscard = () => {
		onClose();
		onOpenChange(false);
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex gap-2 sm:gap-0">
					{showDiscard && (
						<Button variant="outline" className="px-3" onClick={handleDiscard}>
							{discardText}
						</Button>
					)}
					<AlertDialogPrimitiveCancel asChild>
						<Button className="px-3">{cancelText}</Button>
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction asChild>
						<Button
							className="px-3"
							onClick={handleSaveAndClose}
							status={isDestructive ? "error" : "default"}
						>
							{confirmText}
						</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
