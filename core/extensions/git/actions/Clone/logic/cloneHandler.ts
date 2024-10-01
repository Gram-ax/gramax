import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import StorageData from "../../../../storage/models/StorageData";

export interface CloneHandlerProps {
	storageData: StorageData;
	apiUrlCreator: ApiUrlCreator;
	skipCheck?: boolean;
	recursive?: boolean;
	branch?: string;
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
	onError = () => {},
}: CloneHandlerProps): Promise<void> => {
	if (!storageData) return;

	const res = await FetchService.fetch(
		apiUrlCreator.getStorageStartCloneUrl(storageData.name, recursive, skipCheck, branch),
		JSON.stringify(storageData),
		MimeTypes.json,
	);
	if (!res.ok) {
		onError();
		return null;
	}
	onStart();
};

export default cloneHandler;
