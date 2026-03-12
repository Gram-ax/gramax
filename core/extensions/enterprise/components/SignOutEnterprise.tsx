import formateName from "@core/utils/formateName";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
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

const SignOutEnterprise = ({ workspaceConfig, onClose }: SignOutEnterpriseProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const removeWorkspace = async () => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
		await FetchService.fetch(apiUrlCreator.getLogoutEnterpriseUrl(workspaceConfig.path));
		ModalToOpenService.resetValue();
		await refreshPage();
		SourceDataService.refresh();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="info">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{`${t("enterprise.workspace-exit")} «${formateName(workspaceConfig.name, {
							replaceHyphensWithNonBreaking: true,
						})}»?`}
					</AlertDialogTitle>
					<AlertDialogDescription>
						<div dangerouslySetInnerHTML={{ __html: t("enterprise.workspace-exit-warning") }} />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onOpenChange(false)}>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onOpenChange(false);
							removeWorkspace();
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

export default SignOutEnterprise;
