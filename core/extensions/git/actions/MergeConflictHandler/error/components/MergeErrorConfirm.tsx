import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { ComponentProps, useEffect } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import ErrorConfirmService from "../../../../../errorHandlers/client/ErrorConfirmService";
import DefaultErrorComponent from "../../../../../errorHandlers/client/components/DefaultError";
import ErrorForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";
import BranchUpdaterService from "../../../Branch/logic/BranchUpdaterService";
import MergeType from "../../model/MergeType";
import ErrorMergeConflictHandler from "./ErrorMergeConflictHandler";

const MergeErrorConfirm = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const mergeType: MergeType = error.props.mergeType;
	const theirsBranch: string = error.props.theirs;
	const stashHash: string = error.props.theirs;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const lang = PageDataContextService.value.lang;

	const getAbortMergeUrl = () => {
		if (mergeType === MergeType.Branches) return apiUrlCreator.abortMergeBranch(theirsBranch);
		if (mergeType === MergeType.Sync) return apiUrlCreator.abortMergeSync(stashHash);
	};

	const getTitle = () => {
		if (mergeType === MergeType.Branches) return useLocalize("mergeBranchesError", lang);
		if (mergeType === MergeType.Sync) return useLocalize("syncError", lang);
	};

	const getErrorText = () => {
		if (mergeType === MergeType.Branches) return useLocalize("mergeBranchConfirm", lang);
		if (mergeType === MergeType.Sync) return useLocalize("mergeSyncConfirm", lang);
	};

	const abortMerge = async () => await FetchService.fetch<void>(getAbortMergeUrl());

	useEffect(() => {
		if (mergeType === MergeType.Sync && !stashHash) return;
		ErrorConfirmService.onModalOpen = async () => {
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			window.onbeforeunload = () => true;
		};
		ErrorConfirmService.onModalClose = async () => {
			window.onbeforeunload = undefined;
			await abortMerge();
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			await ArticleUpdaterService.update(apiUrlCreator);
		};
	}, []);

	if (mergeType === MergeType.Sync && !stashHash) {
		return <DefaultErrorComponent error={error} onCancelClick={onCancelClick} />;
	}

	return (
		<ErrorForm
			onCancelClick={onCancelClick}
			actionButton={{
				onClick: () => {
					ErrorConfirmService.onModalClose = undefined;
					onCancelClick();
					ModalToOpenService.setValue<ComponentProps<typeof ErrorMergeConflictHandler>>(ModalToOpen.Merge, {
						type: mergeType,
						theirsBranch,
						stashHash,
					});
				},
				text: useLocalize("resolveConflict"),
			}}
			title={getTitle()}
		>
			<span>{getErrorText()}</span>
		</ErrorForm>
	);
};

export default MergeErrorConfirm;
