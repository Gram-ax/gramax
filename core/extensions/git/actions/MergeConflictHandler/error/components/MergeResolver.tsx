import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { useRef, useState } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import BranchUpdaterService from "../../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictHandler from "../../components/MergeConflictHandler";

const MergeResolver = ({ mergeData }: { mergeData: MergeData }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const shouldAbort = useRef(true);

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	return (
		<ModalLayout
			contentWidth={loading ? null : "L"}
			onClose={async () => {
				if (shouldAbort.current) {
					ModalToOpenService.setValue(ModalToOpen.Loading);
					await FetchService.fetch<void>(apiUrlCreator.abortMerge());
					ModalToOpenService.resetValue();
				}
				window.onbeforeunload = undefined;
				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
				ModalToOpenService.resetValue();
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
						shouldAbort.current = false;
						setLoading(false);
						setIsOpen(false);
					}}
				/>
			)}
		</ModalLayout>
	);
};

export default MergeResolver;
