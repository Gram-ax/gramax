import resolveModule from "@app/resolveModule/frontend";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { CallApi, useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import { Router } from "@core/Api/Router";
import { useRouter } from "@core/Api/useRouter";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useCallback, useMemo } from "react";

export const getGesSignInUrl = (gesUrl: string, isBrowser: boolean, isCloud = false) => {
	const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
	const redirect = encodeURIComponent(`${gesUrl}/enterprise/sso/assert`);
	const url = `${gesUrl}${isCloud ? "/enterprise" : ""}/sso/login?redirect=${redirect}&from=${from}`;
	return url;
};

type UseEnterpriseWorkspaceSwitchResult = {
	enterpriseWorkspace?: ClientWorkspaceConfig;
	switchWorkspace: CallApi<unknown>;
};

const useEnterpriseWorkspaceSwitch = (gesUrl: string): UseEnterpriseWorkspaceSwitchResult => {
	const workspaces = WorkspaceService.workspaces();
	const enterpriseWorkspace = useMemo(() => {
		return workspaces.find((item) => item.enterprise?.gesUrl === gesUrl);
	}, [workspaces, gesUrl]);

	const { call: switchWorkspace } = useApi({
		url: (api) => (enterpriseWorkspace ? api.switchWorkspace(enterpriseWorkspace.path) : null),
	});

	return { enterpriseWorkspace, switchWorkspace };
};

type UseEnterpriseSignInParams = {
	gesUrl: string;
	isBrowser: boolean;
	isTauri: boolean;
	apiUrlCreator: ApiUrlCreator;
	router: Router;
};

const useEnterpriseSignIn = ({ gesUrl, isBrowser, isTauri, apiUrlCreator, router }: UseEnterpriseSignInParams) => {
	const { enterpriseWorkspace, switchWorkspace } = useEnterpriseWorkspaceSwitch(gesUrl);

	return useCallback(async () => {
		if (enterpriseWorkspace && isTauri) {
			try {
				await switchWorkspace();
				await refreshPage();
				return;
			} catch (error) {
				console.error("Failed to switch to enterprise workspace", error);
			}
		}

		const url = getGesSignInUrl(gesUrl, isBrowser);
		if (isBrowser) {
			window.location.replace(url);
			return;
		}

		await resolveModule("enterpriseLogin")(url, apiUrlCreator, router);
	}, [enterpriseWorkspace, switchWorkspace, gesUrl, isBrowser, apiUrlCreator, router]);
};

const SignInEnterprise = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const { isBrowser, isTauri } = usePlatform();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;

	const handleSignIn = useEnterpriseSignIn({
		gesUrl,
		isBrowser,
		isTauri,
		apiUrlCreator,
		router,
	});

	return <div onClick={handleSignIn}>{trigger}</div>;
};

export default SignInEnterprise;
