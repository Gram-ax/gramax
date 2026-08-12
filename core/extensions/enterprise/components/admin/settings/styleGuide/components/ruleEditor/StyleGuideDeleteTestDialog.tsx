import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
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
						<CancelButton />
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
