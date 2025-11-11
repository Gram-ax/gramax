import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@ui-kit/AlertDialog";

interface UnsavedChangesProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	onDontSave: () => void;
}

const UnsavedChangesModal = ({ isOpen, onOpenChange, onSave, onDontSave }: UnsavedChangesProps) => {
	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("unsaved-changes")}</AlertDialogTitle>
					<AlertDialogDescription>{t("exit-edit-mode")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onOpenChange(false)}>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						type="button"
						variant="text"
						onClick={() => {
							onOpenChange(false);
							onDontSave();
						}}
					>
						{t("dont-save")}
					</AlertDialogAction>
					<AlertDialogAction
						type="button"
						onClick={() => {
							onOpenChange(false);
							onSave();
						}}
					>
						{t("save-changes")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default UnsavedChangesModal;
