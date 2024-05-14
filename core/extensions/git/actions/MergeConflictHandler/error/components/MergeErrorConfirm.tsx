import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import getAbortMergeUrl from "@ext/git/actions/MergeConflictHandler/error/logic/getAbortMergeUrl";
import { ComponentProps, useEffect } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import ErrorConfirmService from "../../../../../errorHandlers/client/ErrorConfirmService";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";
import BranchUpdaterService from "../../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeType from "../../model/MergeType";
import ErrorMergeConflictHandler from "./ErrorMergeConflictHandler";

const MergeErrorConfirm = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const mergeType: MergeType = error.props.mergeType;
	const stashHash: string = error.props.theirs;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const lang = PageDataContextService.value.lang;

	const getTitle = () => {
		if (mergeType === MergeType.Branches) return useLocalize("mergeBranchesError", lang);
		if (mergeType === MergeType.Sync) return useLocalize("syncError", lang);
	};

	const getErrorText = () => {
		if (mergeType === MergeType.Branches) return useLocalize("mergeBranchConfirm", lang);
		if (mergeType === MergeType.Sync) return useLocalize("mergeSyncConfirm", lang);
	};

	const abortMerge = async () =>
		await FetchService.fetch<void>(getAbortMergeUrl({ apiUrlCreator, error, type: mergeType }));

	useEffect(() => {
		if (mergeType === MergeType.Sync && !stashHash) return;
		ErrorConfirmService.onModalOpen = async () => {
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			window.onbeforeunload = () => true;
		};
		ErrorConfirmService.onModalClose = async () => {
			window.onbeforeunload = undefined;
			if (stashHash) await abortMerge();
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			await ArticleUpdaterService.update(apiUrlCreator);
		};
	}, []);

	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			actionButton={{
				onClick: () => {
					ErrorConfirmService.onModalClose = undefined;
					onCancelClick();
					ModalToOpenService.setValue<ComponentProps<typeof ErrorMergeConflictHandler>>(ModalToOpen.Merge, {
						type: mergeType,
						error,
					});
				},
				text: useLocalize("resolveConflict"),
			}}
			title={getTitle()}
		>
			<span>{getErrorText()}</span>
		</InfoModalForm>
	);
};

export default MergeErrorConfirm;
