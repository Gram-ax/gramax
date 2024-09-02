import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import ModalLayout from "@components/Layouts/Modal";
import t from "@ext/localization/locale/translate";
import { ComponentProps, useEffect, useRef, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import InfoModalForm from "../../../../errorHandlers/client/components/ErrorForm";
import BranchUpdaterService from "../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictCaller from "../model/MergeConflictCaller";
import MergeData from "../model/MergeData";
import MergeResolver from "./MergeResolver";

const MergeConflictConfirm = ({
	mergeData,
	title,
	errorText,
}: {
	mergeData: MergeData;
	title?: string;
	errorText?: string;
}) => {
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
				isWarning
				icon={{ code: "alert-circle", color: "var(--color-admonition-note-br-h)" }}
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
					text: t("resolve-conflict"),
				}}
				title={getTitle()}
			>
				<div className="article">
					<span dangerouslySetInnerHTML={{ __html: getErrorText() }}></span>
				</div>
			</InfoModalForm>
		</ModalLayout>
	);
};

export default MergeConflictConfirm;
