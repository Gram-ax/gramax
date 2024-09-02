import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

const getPathnamePullData = async (
	apiUrlCreator: ApiUrlCreator,
): Promise<{ haveToPull: boolean; canPull: boolean }> => {
	let res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageHaveToPull());
	if (!res.ok) return { haveToPull: false, canPull: false };

	const haveToPull = await res.json();
	if (!haveToPull) return { haveToPull, canPull: false };

	res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageCanPull());
	if (!res.ok) return { haveToPull, canPull: false };

	const canPull = await res.json();
	return { haveToPull, canPull };
};

export default getPathnamePullData;
