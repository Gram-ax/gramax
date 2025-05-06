import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";

export const getGesSignInUrl = (gesUrl: string, isBrowser: boolean) => {
	const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
	const redirect = encodeURIComponent(`${gesUrl}/enterprise/sso/assert`);
	const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${from}`;
	return url;
};

const SignInEnterprise = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const { isBrowser } = usePlatform();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const workspace = WorkspaceService.current();

	return (
		<div
			onClick={async () => {
				const url = getGesSignInUrl(gesUrl, isBrowser);
				if (isBrowser) return window.location.replace(url);
				await resolveModule("enterpriseLogin")(url, apiUrlCreator, router, workspace);
			}}
		>
			{trigger}
		</div>
	);
};

export default SignInEnterprise;
