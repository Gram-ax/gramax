import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import StorageData from "@ext/storage/models/StorageData";

const verifyCatalog = async (storageData: StorageData, apiUrlCreator: ApiUrlCreator) => {
	const res = await FetchService.fetch(apiUrlCreator.getVerifyStorageUrl(), JSON.stringify(storageData), MimeTypes.json);
	return await res.json();
};

export default verifyCatalog;
