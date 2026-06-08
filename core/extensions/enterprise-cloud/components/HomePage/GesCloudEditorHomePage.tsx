import BottomInfo from "@components/HomePage/BottomInfo";
import { HomePageCatalogListContent } from "@components/HomePage/Components/HomePageCatalogListContent";
import { HomePageWrapper } from "@components/HomePage/Components/HomePageWrapper";
import { useRouter } from "@core/Api/useRouter";
import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import { SignInGesCloudForm } from "@ext/enterprise-cloud/components/GesCloudSignInFormModal";
import { GesCloudTopMenu } from "@ext/enterprise-cloud/components/HomePage/GesCloudTopMenu";

export const GesCloudEditorHomePage = ({ data }: { data: HomePageData }) => {
	const isLogged = PageDataContextService.value.isLogged;
	const { enabled } = PageDataContextService.value.conf.enterpriseCloud;
	const router = useRouter();
	const inviteId = router.query.inviteId;

	return (
		<HomePageWrapper>
			<GesCloudTopMenu section={data.section} />
			{!isLogged && enabled ? (
				<div className="flex justify-center items-center h-screen">
					<SignInGesCloudForm allowContinueWithoutAccount={!inviteId} />
				</div>
			) : (
				<HomePageCatalogListContent data={data} />
			)}
			<BottomInfo />
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};
