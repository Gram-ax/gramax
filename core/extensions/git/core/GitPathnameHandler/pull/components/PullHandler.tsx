import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
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
import { useCallback, useEffect, useState } from "react";

const PullHandler = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);

	const onClose = () => {
		setIsOpen(false);
		ModalToOpenService.resetValue();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) ModalToOpenService.resetValue();
	};

	const onSyncClick = useCallback(async () => {
		setIsOpen(false);
		await SyncService.sync(apiUrlCreator);
	}, [apiUrlCreator]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!isOpen) return;
			if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) onSyncClick();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isOpen, onSyncClick]);

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("sync-catalog")}</AlertDialogTitle>
					<AlertDialogDescription>{t("sync-catalog-desc")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onClose} variant="outline">
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onSyncClick} variant="primary">
						{t("sync")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default PullHandler;
