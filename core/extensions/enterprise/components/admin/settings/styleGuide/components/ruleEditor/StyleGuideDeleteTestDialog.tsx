import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogPrimitiveAction,
	AlertDialogPrimitiveCancel,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";

interface DeleteTestDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export const DeleteTestDialog = ({ open, onOpenChange, onConfirm }: DeleteTestDialogProps) => {
	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent focus="medium" status="error">
				<AlertDialogHeader>
					<AlertDialogIcon icon="info" />
					<AlertDialogTitle>{t("confirmation.delete.title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("enterprise.admin.check.test-delete-confirm")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogPrimitiveCancel asChild>
						<Button type="button" variant="outline">
							{t("cancel")}
						</Button>
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction asChild>
						<Button onClick={onConfirm} status="error" type="button">
							{t("delete")}
						</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
