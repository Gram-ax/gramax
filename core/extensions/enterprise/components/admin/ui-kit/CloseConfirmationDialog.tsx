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

interface CloseConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onClose: () => void;
	onDiscard?: () => void | Promise<void>;
	title?: string;
	description?: React.ReactNode;
	cancelText?: string;
	discardText?: string;
	isDestructive?: boolean;
}

export function CloseConfirmationDialog({
	isOpen,
	onOpenChange,
	onClose,
	onDiscard,
	title = t("confirmation.unsaved2.title"),
	description = t("confirmation.unsaved2.body"),
	cancelText = t("confirmation.buttons.cancel"),
	discardText = t("dont-save"),
	isDestructive = false,
}: CloseConfirmationDialogProps) {
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
					<AlertDialogPrimitiveCancel asChild>
						<Button variant="outline">{cancelText}</Button>
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction asChild>
						<Button onClick={handleDiscard} status={isDestructive ? "error" : "default"}>
							{discardText}
						</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
