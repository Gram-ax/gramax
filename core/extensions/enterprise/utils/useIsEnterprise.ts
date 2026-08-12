import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

export function useIsEnterprise(): boolean {
	return Boolean(PageDataContextService.value.conf.enterprise.gesUrl);
}
