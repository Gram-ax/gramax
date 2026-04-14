import { HomePageCatalogListContent } from "@components/HomePage/Components/HomePageCatalogListContent";
import { HomePageWrapper } from "@components/HomePage/Components/HomePageWrapper";
import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import { useSignIn } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import SignInEnterpriseForm from "@ext/enterprise/components/SingInOut/SignInEnterpriseForm";
import { getGesSignInUrl } from "@ext/enterprise/components/SingInOut/utils/getGesSignInUrl";
import { SignInEnterpriseCloudForm } from "@ext/enterprise-cloud/components/SignInEnterpriseCloudForm";
import type React from "react";
import type { Environment } from "../../../app/resolveModule/env";
import BottomInfo from "./BottomInfo";
import TopMenu from "./TopMenu/TopMenu";

interface HomePageProps {
	data: HomePageData;
}

const HomePageContentContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<TopMenu />
			{children}
			<BottomInfo />
		</>
	);
};

const components: Record<Environment, (props: HomePageProps) => React.ReactNode> = {
	tauri: (props) => <TauriEditorHomePage data={props.data} />,
	next: (props) => <NextHomePage data={props.data} />,
	static: (props) => <StaticHomePage data={props.data} />,
	browser: (props) => <BaseEditorHomePage data={props.data} />,
	cli: (props) => <CliHomePage data={props.data} />,
	test: () => null,
	docportal: () => null,
};

const HomePage = ({ data }: HomePageProps) => {
	const { environment } = usePlatform();
	return components[environment]({ data });
};

const OpenSourceEditorHomePage = ({ data }: HomePageProps) => {
	return (
		<HomePageWrapper>
			<HomePageContentContainer>
				<HomePageCatalogListContent data={data} />
			</HomePageContentContainer>
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

const TauriEditorHomePage = ({ data }: HomePageProps) => {
	return <OpenSourceEditorHomePage data={data} />;
};

const StaticHomePage = ({ data }: HomePageProps) => {
	return (
		<HomePageWrapper>
			<HomePageContentContainer>
				<HomePageCatalogListContent data={data} />
			</HomePageContentContainer>
		</HomePageWrapper>
	);
};

const CliHomePage = ({ data }: HomePageProps) => {
	return <StaticHomePage data={data} />;
};

const NextHomePage = ({ data }: HomePageProps) => {
	return <StaticHomePage data={data} />;
};

const BaseEditorHomePage = ({ data }: HomePageProps) => {
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const isEnterprise = !!gesUrl;

	if (isEnterprise) return <GesEditorHomePage data={data} />;
	return <OpenSourceEditorHomePage data={data} />;
};

const GesEditorHomePage = ({ data }: HomePageProps) => {
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const isLogged = PageDataContextService.value.isLogged;
	const authUrl = getGesSignInUrl(gesUrl, true);
	const signInEnterpriseProps = useSignIn({ authUrl });

	return (
		<HomePageWrapper>
			<HomePageContentContainer>
				{!!gesUrl && !isLogged ? (
					<div className="flex justify-center items-center h-screen">
						<SignInEnterpriseForm authUrl={authUrl} {...signInEnterpriseProps} onlySSO />
					</div>
				) : (
					<HomePageCatalogListContent data={data} />
				)}
			</HomePageContentContainer>
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

const GesCloudEditorHomePage = ({ data }: HomePageProps) => {
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const isLogged = PageDataContextService.value.isLogged;

	return (
		<HomePageWrapper>
			<HomePageContentContainer>
				{!!gesUrl && !isLogged ? (
					<div className="flex justify-center items-center h-screen">
						<SignInEnterpriseCloudForm allowContinueWithoutAccount={true} gesUrl={gesUrl} />
					</div>
				) : (
					<HomePageCatalogListContent data={data} />
				)}
			</HomePageContentContainer>
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

export default HomePage;
