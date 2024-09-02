import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import { useRef, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import BranchUpdaterService from "../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictHandler from "./MergeConflictHandler";

const MergeResolver = ({ mergeData }: { mergeData: MergeData }) => {
	const localizeKey = mergeData.caller === MergeConflictCaller.Branch ? "branch" : "sync";

	const apiUrlCreator = ApiUrlCreatorService.value;

	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const closeModalRef = useRef<VoidFunction>(null);
	const isMerged = useRef(false);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	const onClose = async () => {
		window.onbeforeunload = undefined;
		await BranchUpdaterService.updateBranch(apiUrlCreator);
		await ArticleUpdaterService.update(apiUrlCreator);
		ModalToOpenService.resetValue();
	};

	return (
		<>
			<ModalLayout
				preventClose
				contentWidth={loading ? null : "L"}
				onClose={async (closeModal) => {
					closeModalRef.current = closeModal;
					if (!isMerged.current) return setIsConfirmOpen(true);
					closeModalRef.current();
					await onClose();
				}}
				isOpen={isOpen}
			>
				{loading ? (
					spinnerLoader
				) : (
					<MergeConflictHandler
						reverseMerge={mergeData.reverseMerge}
						rawFiles={mergeData.mergeFiles}
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
						}}
					/>
				)}
			</ModalLayout>
			<ModalLayout
				isOpen={isConfirmOpen}
				onOpen={() => setIsConfirmOpen(true)}
				onClose={() => setIsConfirmOpen(false)}
			>
				<InfoModalForm
					icon={{ code: "circle-alert", color: "rgb(255 187 1)" }}
					title={t(`git.merge.conflict.abort-confirm.title.${localizeKey}`)}
					isWarning={true}
					onCancelClick={() => setIsConfirmOpen(false)}
					actionButton={{
						onClick: async () => {
							setIsConfirmOpen(false);
							setIsOpen(false);
							closeModalRef.current();

							ModalToOpenService.setValue(ModalToOpen.Loading);
							await FetchService.fetch<void>(apiUrlCreator.abortMerge());
							ModalToOpenService.resetValue();

							await onClose();
						},
						text: t(`git.merge.conflict.abort-confirm.action-button.${localizeKey}`),
					}}
					closeButton={{ text: t("git.merge.conflict.abort-confirm.cancel-button") }}
				>
					<span>{t(`git.merge.conflict.abort-confirm.body.${localizeKey}`)}</span>
				</InfoModalForm>
			</ModalLayout>
		</>
	);
};

export default MergeResolver;
