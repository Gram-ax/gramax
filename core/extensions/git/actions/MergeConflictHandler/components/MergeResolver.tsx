import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
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
import { Dialog, DialogContent, DialogHeaderTemplate } from "@ui-kit/Dialog";
import { GitMerge } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import BranchUpdaterService from "../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictHandler from "./MergeConflictHandler";

export interface MergeResolverProps {
	mergeData: MergeData;
	onResolve?: () => void;
	onAbort?: () => void;
	onUpdateBranch?: boolean;
}

const MergeResolver = ({ mergeData, onResolve, onAbort, onUpdateBranch = true }: MergeResolverProps) => {
	const localizeKey = mergeData.caller === MergeConflictCaller.Branch ? "branch" : "sync";

	const apiUrlCreator = ApiUrlCreatorService.value;

	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const isMerged = useRef(false);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	const onClose = useCallback(async () => {
		window.onbeforeunload = undefined;
		if (onUpdateBranch) await BranchUpdaterService.updateBranch(apiUrlCreator);
		await ArticleUpdaterService.update(apiUrlCreator);
		ModalToOpenService.resetValue();
		onResolve?.();
	}, [apiUrlCreator, onResolve, onUpdateBranch]);

	const handleAbortConfirm = useCallback(async () => {
		setIsConfirmOpen(false);
		setIsOpen(false);

		ModalToOpenService.setValue(ModalToOpen.Loading);
		await FetchService.fetch<void>(apiUrlCreator.abortMerge());
		ModalToOpenService.resetValue();
		onAbort?.();
	}, [apiUrlCreator, onAbort]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open && !isMerged.current) {
				setIsConfirmOpen(true);
				return;
			}
			setIsOpen(open);
			if (!open) void onClose();
		},
		[onClose],
	);

	return (
		<>
			<Dialog onOpenChange={onOpenChange} open={isOpen}>
				<DialogContent size="FS">
					<DialogHeaderTemplate
						description={t("git.merge.conflict.resolver.description")}
						icon={GitMerge}
						title={t("git.merge.conflict.resolver.title")}
					/>
					{loading ? (
						<div className="flex h-full min-h-[20rem] items-center justify-center">{spinnerLoader}</div>
					) : (
						<MergeConflictHandler
							onMerge={async (mergedFiles) => {
								setLoading(true);
								await FetchService.fetch(
									apiUrlCreator.resolveMerge(),
									JSON.stringify(mergedFiles),
									MimeTypes.json,
								);
								isMerged.current = true;
								setLoading(false);
								setIsOpen(false);
								await onClose();
							}}
							rawFiles={mergeData.mergeFiles}
							reverseMerge={mergeData.reverseMerge}
						/>
					)}
				</DialogContent>
			</Dialog>
			<AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
				<AlertDialogContent status="warning">
					<AlertDialogHeader>
						<AlertDialogIcon icon="alert-circle" />
						<AlertDialogTitle>
							{t(`git.merge.conflict.abort-confirm.title.${localizeKey}`)}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(`git.merge.conflict.abort-confirm.body.${localizeKey}`)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setIsConfirmOpen(false)} variant="outline">
							{t("git.merge.conflict.abort-confirm.cancel-button")}
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleAbortConfirm} status="warning" variant="primary">
							{t(`git.merge.conflict.abort-confirm.action-button.${localizeKey}`)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default MergeResolver;
