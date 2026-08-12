import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { useState } from "react";

interface SignOutEnterpriseProps {
	workspaceConfig: ClientWorkspaceConfig;
	onClose: () => void;
}

const SignOutGesCloud = ({ workspaceConfig, onClose }: SignOutEnterpriseProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose();
	};

	const { environment } = usePlatform();

	const removeWorkspace = async () => {
		const modalId = ModalToOpenService.addModal(ModalToOpen.Loading);
		await FetchService.fetch(apiUrlCreator.getLogoutGesCloudUrl(workspaceConfig.path));

		ModalToOpenService.removeModal(modalId);
		onOpenChange(false);

		if (environment === "tauri") await refreshPage();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="info">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("enterprise-cloud.sign-out.title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("enterprise-cloud.sign-out.description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onOpenChange(false)}>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onOpenChange(false);
							void removeWorkspace();
						}}
						type="button"
						variant="primary"
					>
						{t("exit")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SignOutGesCloud;
