import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
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

interface ConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: () => void | Promise<void>;
	onClose: () => void;
	onDiscard?: () => void | Promise<void>;
	title?: string;
	description?: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	discardText?: string;
	showDiscard?: boolean;
	isDestructive?: boolean;
	formId?: string;
}

export function ConfirmationDialog({
	isOpen,
	onOpenChange,
	onSave,
	onClose,
	onDiscard,
	title = t("confirmation.unsaved.title"),
	description = t("confirmation.unsaved.body"),
	confirmText = t("save-and-close"),
	cancelText = t("confirmation.buttons.cancel"),
	discardText = t("dont-save"),
	showDiscard = true,
	isDestructive = false,
	formId,
}: ConfirmationDialogProps) {
	const handleSaveAndClose = async () => {
		// Await the save and skip the pending action when it fails — otherwise
		// the caller would proceed (level switch / close) as if the data were saved.
		try {
			await onSave();
		} catch {
			onOpenChange(false);
			return;
		}
		onClose();
		onOpenChange(false);
	};

	const handleDiscard = async () => {
		await (onDiscard ?? onClose)();
		onOpenChange(false);
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent className="focus-visible:outline-none" overlayType="dimmed">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex gap-2 sm:gap-0">
					{showDiscard && (
						<Button onClick={handleDiscard} variant="text">
							{discardText}
						</Button>
					)}
					<AlertDialogPrimitiveCancel asChild>
						<Button variant="outline">{cancelText}</Button>
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction asChild>
						<Button
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
