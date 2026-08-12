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
import { Icon } from "@ui-kit/Icon";

interface DeleteConfirmationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	selectedCount: number;
	description?: React.ReactNode;
	loading?: boolean;
}

export const DeleteConfirmationDialog = (props: DeleteConfirmationDialogProps) => {
	const { isOpen, onOpenChange, onConfirm, selectedCount, description, loading } = props;

	const body =
		description ||
		t("confirmation.delete.body")
			.replace("{count}", selectedCount.toString())
			.replace("{item}", selectedCount === 1 ? t("record") : t("records"));

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent className="font-sans font-normal" focus="medium" overlayType="dimmed" status="error">
				<AlertDialogHeader>
					<AlertDialogIcon icon="info" />
					<AlertDialogTitle>{t("confirmation.delete.title")}</AlertDialogTitle>
					<AlertDialogDescription style={{ whiteSpace: "pre-line" }}>{body}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogPrimitiveCancel asChild disabled={loading}>
						<CancelButton />
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction asChild>
						<Button
							disabled={loading}
							onClick={(e) => {
								e.preventDefault();
								onConfirm();
							}}
							status="error"
							type="button"
						>
							{loading && <Icon icon="loader" />}
							{loading ? `${t("deleting")}...` : t("delete")}
						</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
