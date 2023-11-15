import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import { useEffect, useState } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import BranchUpdaterService from "../../../Branch/logic/BranchUpdaterService";
import MergeConflictHandler from "../../components/MergeConflictHandler";
import { MergeFile } from "../../model/MergeFile";
import MergeType from "../../model/MergeType";

const ErrorMergeConflictHandler = ({
	type,
	theirsBranch,
	stashHash,
}: {
	type: MergeType;
	theirsBranch: string;
	stashHash: string;
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [files, setFiles] = useState<MergeFile[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [merged, setMerged] = useState(false);

	const getAbortMergeUrl = () => {
		if (type === MergeType.Branches) return apiUrlCreator.abortMergeBranch(theirsBranch);
		if (type === MergeType.Sync) return apiUrlCreator.abortMergeSync(stashHash);
	};

	const getResolveMergeConflictFilesUrl = () => {
		if (type === MergeType.Branches) return apiUrlCreator.resolveMergeBranchConflictedFiles(theirsBranch);
		if (type === MergeType.Sync) return apiUrlCreator.resolveMergeSyncConflictedFiles(stashHash);
	};

	const abortMerge = async () => {
		setLoading(true);
		await FetchService.fetch<void>(getAbortMergeUrl());
		setLoading(false);
	};

	const getFilesToMerge = async () => {
		const filesToMergeUrl = apiUrlCreator.getFilesToMerge();
		setLoading(true);
		const response = await FetchService.fetch<MergeFile[]>(filesToMergeUrl);
		if (!response.ok) {
			setIsOpen(false);
			return;
		}
		setFiles(await response.json());
		setLoading(false);
	};

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);
	useEffect(() => {
		getFilesToMerge();
		window.onbeforeunload = () => true;
	}, []);

	return (
		<ModalLayout
			contentWidth={loading ? null : "80%"}
			onClose={async () => {
				window.onbeforeunload = undefined;
				if (!merged) await abortMerge();
				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
				ModalToOpenService.setValue(null, null);
			}}
			isOpen={isOpen}
		>
			{loading ? (
				spinnerLoader
			) : (
				<MergeConflictHandler
					rawFiles={files}
					onMerge={async (mergedFiles) => {
						setLoading(true);
						const response = await FetchService.fetch<void>(
							getResolveMergeConflictFilesUrl(),
							JSON.stringify(mergedFiles),
							MimeTypes.json,
						);
						setLoading(false);
						if (!response.ok) return;
						setMerged(true);
						setIsOpen(false);
						window.onbeforeunload = undefined;
					}}
				/>
			)}
		</ModalLayout>
	);
};

export default ErrorMergeConflictHandler;
