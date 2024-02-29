import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import Progress from "../../../../storage/models/Progress";
import StorageData from "../../../../storage/models/StorageData";

export interface CloneHandlerProps {
	storageData: StorageData;
	apiUrlCreator: ApiUrlCreator;
	skipCheck?: boolean;
	recursive?: boolean;
	branch?: string;
	onProgress?: (progress: Progress) => void;
	onStart?: VoidFunction;
	onFinish?: (path: string) => void;
	onError?: VoidFunction;
}

const cloneHandler = async ({
	storageData,
	apiUrlCreator,
	skipCheck = false,
	recursive = true,
	branch,
	onStart = () => {},
	onFinish = () => {},
	onError = () => {},
	onProgress = () => {},
}: CloneHandlerProps): Promise<void> => {
	if (!storageData) return;

	onStart();
	const pRes = FetchService.fetch(
		apiUrlCreator.getStorageCloneUrl(storageData.name, recursive, skipCheck, branch),
		JSON.stringify(storageData),
		MimeTypes.json,
	);

	/* eslint-disable */
	const intervalIdx = setInterval(async () => {
		const progress = await FetchService.fetch<Progress>(apiUrlCreator.getStorageCloneProgressUrl(storageData.name));
		if (!progress.ok) return;
		const data = await progress.json();
		onProgress(data);
	}, 50);

	const res = await pRes;
	onProgress(null);
	clearInterval(intervalIdx);

	if (!res.ok) {
		onError();
		return null;
	}
	onFinish(await res.text());
};

export default cloneHandler;
