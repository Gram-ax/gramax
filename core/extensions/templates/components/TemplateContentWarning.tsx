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
import { useState } from "react";

export interface TemplateContentWarningProps {
	initialIsOpen: boolean;
	action: () => void;
	onClose?: () => void;
	templateName: string;
}

const TemplateContentWarning = ({ initialIsOpen, onClose, action, templateName }: TemplateContentWarningProps) => {
	const [isOpen, setIsOpen] = useState(initialIsOpen);

	const handleClose = () => {
		setIsOpen(false);
		onClose?.();
	};

	const handleAction = () => {
		setIsOpen(false);
		action();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose?.();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>
						{t("template.warning.content.name").replace("{{template}}", templateName)}
					</AlertDialogTitle>
					<AlertDialogDescription>{t("template.warning.content.body")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleClose} variant="outline">
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleAction} variant="primary">
						{t("continue")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default TemplateContentWarning;
