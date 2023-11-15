import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import Progress from "../../../../storage/models/Progress";
import StorageData from "../../../../storage/models/StorageData";

const cloneHandler = async ({
	storageData,
	apiUrlCreator,
	recursive = true,
	branch,
	onStart = () => {},
	onProgress = () => {},
}: {
	storageData: StorageData;
	apiUrlCreator: ApiUrlCreator;
	recursive?: boolean;
	branch?: string;
	onStart?: (isStart: boolean) => void;
	onProgress?: (progress: Progress) => void;
}): Promise<string> => {
	if (!storageData) return;

	onStart(true);
	const pRes = FetchService.fetch(
		apiUrlCreator.getStorageCloneUrl(storageData.name, recursive, branch),
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
	onStart(false);
	onProgress(null);
	clearInterval(intervalIdx);

	if (!res.ok) return null;
	return await res.text();
};

export default cloneHandler;
