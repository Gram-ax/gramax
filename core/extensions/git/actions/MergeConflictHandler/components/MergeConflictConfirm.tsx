import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import tryOpenMergeResolver from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeResolver";
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
import { useEffect, useRef, useState } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictCaller from "../model/MergeConflictCaller";
import type MergeData from "../model/MergeData";

export interface MergeConflictConfirmProps {
	mergeData: MergeData;
	title?: string;
	errorText?: string;
	onResolve?: () => void;
	onAbort?: () => void;
}

const MergeConflictConfirm = ({ mergeData, title, errorText, onResolve, onAbort }: MergeConflictConfirmProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const caller = mergeData.caller;

	const [isOpen, setIsOpen] = useState(true);
	const shouldAbort = useRef(true);

	const getTitle = () => {
		if (title) return title;
		if (caller === MergeConflictCaller.Branch) return t("git.merge.error.branches");
		if (caller === MergeConflictCaller.Sync) return t("git.merge.error.sync");
	};

	const getErrorText = () => {
		if (errorText) return errorText;
		if (caller === MergeConflictCaller.Branch) return t("git.merge.confirm.branch");
		if (caller === MergeConflictCaller.Sync) return t("git.merge.confirm.sync");
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void (async () => {
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			window.onbeforeunload = () => true;
		})();
	}, []);

	const onClose = async () => {
		setIsOpen(false);
		if (!shouldAbort.current) {
			return;
		}
		await FetchService.fetch<void>(apiUrlCreator.abortMerge());
		window.onbeforeunload = undefined;
		await BranchUpdaterService.updateBranch(apiUrlCreator);
		await ArticleUpdaterService.update(apiUrlCreator);
		ModalToOpenService.resetValue();
		onAbort?.();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) void onClose();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{getTitle()}</AlertDialogTitle>
					<AlertDialogDescription>
						{/** biome-ignore lint/style/useNamingConvention: expected */}
						<span dangerouslySetInnerHTML={{ __html: getErrorText() }} />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							tryOpenMergeResolver({
								mergeData,
								onResolve,
								onAbort,
							});
							shouldAbort.current = false;
						}}
						variant="primary"
					>
						{t("resolve-conflict")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default MergeConflictConfirm;
