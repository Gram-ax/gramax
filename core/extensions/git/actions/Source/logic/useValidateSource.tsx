import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type PageDataContext from "@core/Context/PageDataContext";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import type NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback } from "react";

export type ValidateSourceFn = (source: SourceData) => Promise<boolean>;

const validateSource = async (
	source: SourceData,
	pageData: PageDataContext,
	apiUrlCreator: ApiUrlCreator,
	onNetworkApiError: (error: NetworkApiError) => void,
) => {
	const sourceApi = makeSourceApi(source, pageData.conf.authServiceUrl, onNetworkApiError);
	if (!sourceApi) return;

	const isValid = await sourceApi.isCredentialsValid();

	if (!source.isInvalid === isValid) return isValid;

	const sourceIndex = pageData.sourceDatas.findIndex((s) => s === source);
	if (sourceIndex === -1) return isValid;

	source.isInvalid = !isValid;
	await FetchService.fetch(apiUrlCreator.setSourceState(getStorageNameByData(source), isValid), MimeTypes.json);

	return isValid;
};

const useValidateSource = () => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onNetworkApiError = OnNetworkApiErrorService.value;

	return useCallback(
		(source: SourceData) => validateSource(source, pageData, apiUrlCreator, onNetworkApiError),
		[pageData, apiUrlCreator, onNetworkApiError],
	);
};

export { useValidateSource };
