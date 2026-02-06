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
	AlertDialogTrigger,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";

interface AlertDeleteDialogProps {
	onConfirm: () => void;
	selectedCount: number;
	description?: React.ReactNode;
	hidden?: boolean;
	loading?: boolean;
}

export const AlertDeleteDialog = ({
	onConfirm,
	selectedCount,
	description,
	hidden,
	loading,
}: AlertDeleteDialogProps) => {
	if (hidden) return null;
	if (loading)
		return (
			<Button variant="outline">
				<Icon icon="loader" />
				{`${t("deleting")}...`}
			</Button>
		);

	const body =
		description ||
		t("confirmation.delete.body")
			.replace("{count}", selectedCount.toString())
			.replace("{item}", selectedCount === 1 ? t("record") : t("records"));

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline">
					<Icon icon="trash" />
					{t("delete")} ({selectedCount})
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent focus="medium" status="error">
				<AlertDialogHeader>
					<AlertDialogIcon icon="info" />
					<AlertDialogTitle>{t("confirmation.delete.title")}</AlertDialogTitle>
					<AlertDialogDescription style={{ whiteSpace: "pre-line" }}>{body}</AlertDialogDescription>
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
