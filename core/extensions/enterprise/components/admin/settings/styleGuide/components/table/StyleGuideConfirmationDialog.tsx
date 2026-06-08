import t from "@ext/localization/locale/translate";
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

interface StyleGuideConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	onClose: () => void;
	handleDiscard: () => void;
	title?: string;
	description?: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	discardText?: string;
	showDiscard?: boolean;
	isDestructive?: boolean;
	formId?: string;
}

export function StyleGuideConfirmationDialog({
	isOpen,
	onOpenChange,
	onSave,
	onClose,
	handleDiscard,
	title = t("confirmation.unsaved.title"),
	description = t("confirmation.unsaved.body"),
	confirmText = t("save-and-close"),
	cancelText = t("cancel"),
	discardText = t("dont-save"),
	showDiscard = true,
	isDestructive = false,
	formId,
}: StyleGuideConfirmationDialogProps) {
	const handleSaveAndClose = () => {
		onSave();
		if (!formId) {
			onClose();
		}
		onOpenChange(false);
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex gap-2 sm:gap-0">
					{showDiscard && (
						<Button className="px-3" onClick={handleDiscard} variant="outline">
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
							{...(formId ? { type: "submit", form: formId } : {})}
						>
							{confirmText}
						</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
