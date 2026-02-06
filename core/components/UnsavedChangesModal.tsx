import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";

interface UnsavedChangesProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: () => void;
	onDontSave: () => void;
}

const UnsavedChangesModal = ({ isOpen, onOpenChange, onSave, onDontSave }: UnsavedChangesProps) => {
	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("unsaved-changes")}</AlertDialogTitle>
					<AlertDialogDescription>{t("exit-edit-mode")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onOpenChange(false)}>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onOpenChange(false);
							onDontSave();
						}}
						type="button"
						variant="text"
					>
						{t("dont-save")}
					</AlertDialogAction>
					<AlertDialogAction
						onClick={() => {
							onOpenChange(false);
							onSave();
						}}
						type="button"
					>
						{t("save-changes")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default UnsavedChangesModal;
