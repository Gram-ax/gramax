import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
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

export interface MergeRequestConfirmProps {
	sourceBranch: string;
	targetBranch: string;
	deleteAfterMerge: boolean;
	squash: boolean;
	onCancelClick?: () => void | Promise<void>;
	onMergeClick?: () => void | Promise<void>;
}

const getBodyKey = (squash: boolean, deleteAfterMerge: boolean) => {
	if (squash) {
		return deleteAfterMerge
			? "git.merge-requests.confirm.body.squash-delete-branch-comment"
			: "git.merge-requests.confirm.body.squash-comment";
	}
	return deleteAfterMerge
		? "git.merge-requests.confirm.body.delete-branch-after-merge"
		: "git.merge-requests.confirm.body.not-delete-branch-after-merge";
};

const MergeRequestConfirm = (props: MergeRequestConfirmProps) => {
	const { sourceBranch, targetBranch, deleteAfterMerge, squash, onCancelClick, onMergeClick } = props;

	const [isOpen, setIsOpen] = useState(true);

	const close = () => {
		setIsOpen(false);
		ModalToOpenService.resetValue();
	};

	const handleCancelClick = async () => {
		close();
		await onCancelClick?.();
	};

	const handleMergeClick = async () => {
		close();
		await onMergeClick?.();
	};

	const bodyHtml = t(getBodyKey(squash, deleteAfterMerge))
		.replaceAll("{{sourceBranch}}", sourceBranch)
		.replaceAll("{{targetBranch}}", targetBranch);

	return (
		<AlertDialog onOpenChange={setIsOpen} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("git.merge-requests.confirm.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{/** biome-ignore lint/style/useNamingConvention: expected */}
						<span className="article bg-transparent" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancelClick} variant="outline">
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleMergeClick} variant="primary">
						{t("git.merge.merge")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default MergeRequestConfirm;
