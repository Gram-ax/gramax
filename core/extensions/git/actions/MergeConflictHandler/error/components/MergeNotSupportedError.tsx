import { ComponentProps, useEffect } from "react";
import ArticleUpdaterService from "../../../../../../components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import ErrorConfirmService from "../../../../../errorHandlers/client/ErrorConfirmService";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";
import BranchUpdaterService from "../../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeType from "../../model/MergeType";

const MergeNotSupportedErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
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

	const abortMerge = async () => {
		await FetchService.fetch<void>(getAbortMergeUrl());
	};

	const onClose = async () => {
		await abortMerge();
		await BranchUpdaterService.updateBranch(apiUrlCreator);
		await ArticleUpdaterService.update(apiUrlCreator);
	};

	useEffect(() => {
		ErrorConfirmService.onModalClose = async () => await onClose();
	}, []);

	return (
		<InfoModalForm onCancelClick={onCancelClick} title={getTitle()} closeButton={{ text: useLocalize("ok") }}>
			<span>{error.message}</span>
		</InfoModalForm>
	);
};

export default MergeNotSupportedErrorComponent;
