import BottomInfo from "@components/HomePage/BottomInfo";
import { HomePageCatalogListContent } from "@components/HomePage/Components/HomePageCatalogListContent";
import { HomePageWrapper } from "@components/HomePage/Components/HomePageWrapper";
import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import GesWebTopMenu from "@ext/enterprise/components/HomePage/GesWebTopMenu";
import { useSignIn } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import SignInEnterpriseForm from "@ext/enterprise/components/SingInOut/SignInEnterpriseForm";
import { getGesSignInUrl } from "@ext/enterprise/components/SingInOut/utils/getGesSignInUrl";

const GesEditorHomePage = ({ data }: { data: HomePageData }) => {
	const gesUrl = PageDataContextService.value.conf.activeGesUrl;
	const isLogged = PageDataContextService.value.isLogged;
	const authUrl = getGesSignInUrl(gesUrl, true);
	const signInEnterpriseProps = useSignIn({ authUrl });

	return (
		<HomePageWrapper>
			<GesWebTopMenu section={data.section} />
			{!isLogged ? (
				<div className="flex justify-center items-center h-screen">
					<SignInEnterpriseForm authUrl={authUrl} {...signInEnterpriseProps} onlySSO />
				</div>
			) : (
				<HomePageCatalogListContent data={data} />
			)}
			<BottomInfo />
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

export default GesEditorHomePage;
