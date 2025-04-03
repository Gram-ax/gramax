import { useCallback, useEffect } from "react";
import PageDataContext from "../../../../../logic/Context/PageDataContext";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import { useValidateSource, type ValidateSourceFn } from "./useValidateSource";

const findInvalidSources = async (pageData: PageDataContext, validateSource: ValidateSourceFn) => {
	const promises = pageData.sourceDatas.map(validateSource);
	await Promise.all(promises);
	pageData.sourceDatas = [...pageData.sourceDatas];
};

const useFindInvalidSources = () => {
	const validateSource = useValidateSource();
	const pageData = PageDataContextService.value;

	return useCallback(async () => {
		await findInvalidSources(pageData, validateSource);
		PageDataContextService.value = { ...pageData };
	}, [pageData, validateSource]);
};

const useFindInvalidSouresOnStart = (isFirstLoad: boolean) => {
	const findInvalidSources = useFindInvalidSources();

	useEffect(() => {
		if (!isFirstLoad) return;
		findInvalidSources();
	}, [findInvalidSources, isFirstLoad]);
};

export { useFindInvalidSources, useFindInvalidSouresOnStart };
