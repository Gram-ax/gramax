import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ModalLayout from "@components/Layouts/Modal";
import { ComponentProps, useEffect, useRef, useState } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import useLocalize from "../../../../../localization/useLocalize";
import BranchUpdaterService from "../../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictCaller from "../../model/MergeConflictCaller";
import MergeData from "../../model/MergeData";
import MergeResolver from "./MergeResolver";

const MergeConflictConfirm = ({ mergeData }: { mergeData: MergeData }) => {
	const lang = PageDataContextService.value.lang;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const caller = mergeData.caller;

	const [isOpen, setIsOpen] = useState(true);
	const shouldAbort = useRef(true);

	const getTitle = () => {
		if (caller === MergeConflictCaller.Branch) return useLocalize("mergeBranchesError", lang);
		if (caller === MergeConflictCaller.Sync) return useLocalize("syncError", lang);
	};

	const getErrorText = () => {
		if (caller === MergeConflictCaller.Branch) return useLocalize("mergeBranchConfirm", lang);
		if (caller === MergeConflictCaller.Sync) return useLocalize("mergeSyncConfirm", lang);
	};

	useEffect(() => {
		(async () => {
			await BranchUpdaterService.updateBranch(apiUrlCreator);
			window.onbeforeunload = () => true;
		})();
	}, []);

	return (
		<ModalLayout
			isOpen={isOpen}
			onClose={async () => {
				setIsOpen(false);
				if (!shouldAbort.current) return;
				ModalToOpenService.setValue(ModalToOpen.Loading);
				await FetchService.fetch<void>(apiUrlCreator.abortMerge());
				ModalToOpenService.resetValue();
				window.onbeforeunload = undefined;

				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
			}}
		>
			<InfoModalForm
				onCancelClick={() => {
					setIsOpen(false);
				}}
				actionButton={{
					onClick: () => {
						ModalToOpenService.setValue<ComponentProps<typeof MergeResolver>>(ModalToOpen.MergeResolver, {
							mergeData,
						});
						shouldAbort.current = false;
					},
					text: useLocalize("resolveConflict"),
				}}
				title={getTitle()}
			>
				<span>{getErrorText()}</span>
			</InfoModalForm>
		</ModalLayout>
	);
};

export default MergeConflictConfirm;
