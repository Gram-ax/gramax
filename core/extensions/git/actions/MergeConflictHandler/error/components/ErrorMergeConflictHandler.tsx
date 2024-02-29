import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import getAbortMergeUrl from "@ext/git/actions/MergeConflictHandler/error/logic/getAbortMergeUrl";
import getResolveMergeConflictFilesUrl from "@ext/git/actions/MergeConflictHandler/error/logic/getResolveMergeConflictFilesUrl";
import { ComponentProps, useEffect, useState } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ModalToOpenService from "../../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import BranchUpdaterService from "../../../Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeConflictHandler from "../../components/MergeConflictHandler";
import { MergeFile } from "../../model/MergeFile";
import MergeType from "../../model/MergeType";

const ErrorMergeConflictHandler = ({
	type,
	error,
}: {
	type: MergeType;
} & Pick<ComponentProps<typeof GetErrorComponent>, "error">) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [files, setFiles] = useState<MergeFile[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [merged, setMerged] = useState(false);

	const abortMerge = async () => {
		setLoading(true);
		await FetchService.fetch<void>(getAbortMergeUrl({ apiUrlCreator, error, type }));
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
			contentWidth={loading ? null : "L"}
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
							getResolveMergeConflictFilesUrl({ apiUrlCreator, error, type }),
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
