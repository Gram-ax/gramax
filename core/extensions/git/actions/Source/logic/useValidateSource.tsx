import type PageDataContext from "@core/Context/PageDataContext";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import type NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback } from "react";
import { useIsEnterprise } from "../../../../enterprise/utils/useIsEnterprise";

export type ValidateSourceFn = (source: SourceData) => Promise<boolean>;

const validateSource = async (
	source: SourceData,
	pageData: PageDataContext,
	isEnterprise: boolean,
	sourceDatas: SourceData[],
	apiUrlCreator: ApiUrlCreator,
	onNetworkApiError: (error: NetworkApiError) => void,
) => {
	const sourceApi = makeSourceApi(
		source,
		pageData.settings?.services?.auth?.endpoint,
		isEnterprise ? undefined : onNetworkApiError,
	);

	if (!sourceApi) return;

	const isValid = await sourceApi.isCredentialsValid();

	if (!source.isInvalid === isValid) return isValid;

	const sourceIndex = sourceDatas.indexOf(source);
	if (sourceIndex === -1) return isValid;

	source.isInvalid = !isValid;
	await FetchService.fetch(apiUrlCreator.setSourceState(getStorageNameByData(source), isValid), MimeTypes.json);

	return isValid;
};

const useValidateSource = () => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onNetworkApiError = OnNetworkApiErrorService.value;
	const isEnterprise = useIsEnterprise();

	return useCallback(
		(source: SourceData, sourceDatas: SourceData[]) =>
			validateSource(source, pageData, isEnterprise, sourceDatas, apiUrlCreator, onNetworkApiError),
		[isEnterprise],
	);
};

export { useValidateSource };
