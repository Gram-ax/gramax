import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import FavoriteCatalogLinkService from "@ext/article/Favorite/components/FavoriteCatalogLinkService";
import { getGesSignInUrl } from "@ext/enterprise/components/SignInEnterprise";
import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import { SignInEnterpriseCloudForm } from "@ext/enterprise-cloud/components/SignInEnterpriseCloudForm";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import type React from "react";
import type { Environment } from "../../../app/resolveModule/env";
import BottomInfo from "./BottomInfo";
import Groups from "./Groups";
import NoneGroups from "./NoneGroups";
import TopMenu from "./TopMenu";

interface HomePageProps {
	data: HomePageData;
	className?: string;
}

const homePageWrapperClassName = "bg-primary-bg flex flex-col";

const HomePageWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
	const breakpoint = useBreakpoint();

	return <div className={`${className} breakpoint-${breakpoint} ${homePageWrapperClassName}`}>{children}</div>;
};

const HomePageContentContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<ScrollShadowContainer shadowTopClassName="top-shadow" wrapperClassName="flex flex-col shadow-scroll h-full">
			<TopMenu />
			{children}
			<BottomInfo />
		</ScrollShadowContainer>
	);
};

const HomePageCatalogListContent = ({ data }: { data: HomePageData }) => {
	const catalogCount = data.catalogsLinks.length;

	return catalogCount ? (
		<FavoriteCatalogLinkService.Init value={data.catalogsLinks}>
			<Groups breadcrumb={data.breadcrumb} className="groups" group={data.group} section={data.section} />
		</FavoriteCatalogLinkService.Init>
	) : (
		<NoneGroups />
	);
};

const components: Record<Environment, (props: HomePageProps) => React.ReactNode> = {
	tauri: (props) => <TauriEditorHomePage className={props.className} data={props.data} />,
	next: (props) => <DocportalEditorHomePage className={props.className} data={props.data} />,
	static: (props) => <StaticHomePage className={props.className} data={props.data} />,
	browser: (props) => <BaseEditorHomePage className={props.className} data={props.data} />,
	cli: (props) => <CliHomePage className={props.className} data={props.data} />,
	test: () => null,
};

const HomePage = ({ data, className }: HomePageProps) => {
	const { environment } = usePlatform();
	return components[environment]({ data, className });
};

const OpenSourceEditorHomePage = ({ data, className }: HomePageProps) => {
	return (
		<HomePageWrapper className={className}>
			<HomePageContentContainer>
				<HomePageCatalogListContent data={data} />
			</HomePageContentContainer>
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

const TauriEditorHomePage = ({ data, className }: HomePageProps) => {
	return <OpenSourceEditorHomePage className={className} data={data} />;
};

const StaticHomePage = ({ data, className }: HomePageProps) => {
	return (
		<HomePageWrapper className={className}>
			<HomePageContentContainer>
				<HomePageCatalogListContent data={data} />
			</HomePageContentContainer>
		</HomePageWrapper>
	);
};

const CliHomePage = ({ data, className }: HomePageProps) => {
	return <StaticHomePage className={className} data={data} />;
};

const DocportalEditorHomePage = ({ data, className }: HomePageProps) => {
	return <StaticHomePage className={className} data={data} />;
};

const BaseEditorHomePage = ({ data, className }: HomePageProps) => {
	const { gesUrl, isCloud } = PageDataContextService.value.conf.enterprise;
	const isEnterprise = !!gesUrl;

	if (isEnterprise && isCloud) return <GesCloudEditorHomePage className={className} data={data} />;
	if (isEnterprise && !isCloud) return <GesEditorHomePage className={className} data={data} />;
	return <OpenSourceEditorHomePage className={className} data={data} />;
};

const GesEditorHomePage = ({ data, className }: HomePageProps) => {
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const authUrl = getGesSignInUrl(gesUrl, true);
	const isGesUnauthorized = PageDataContextService.value.isGesUnauthorized;
	const signInEnterpriseProps = useSignInEnterprise({ authUrl });

	return (
		<HomePageWrapper className={className}>
			<HomePageContentContainer>
				{isGesUnauthorized ? (
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

const GesCloudEditorHomePage = ({ data, className }: HomePageProps) => {
	const { gesUrl } = PageDataContextService.value.conf.enterprise;
	const isGesUnauthorized = PageDataContextService.value.isGesUnauthorized;

	return (
		<HomePageWrapper className={className}>
			<HomePageContentContainer>
				{isGesUnauthorized ? (
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

export default styled(HomePage)`
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: auto;
	font-family: Roboto, sans-serif;

	.shadow-scroll > div {
		display: flex;
		flex-direction: column;
	}

	.groups {
		margin-top: 1.8rem;
	}

	> div:has(.scroll-area) {
		height: 100%;
	}

	.groups,
	.top-menu,
	.bottom-info,
	.search-container {
		width: 100%;
		max-width: 509px;
		margin-left: auto;
		margin-right: auto;
	}

	&.breakpoint-sm {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 100%;
			padding-right: 1rem;
			padding-left: 1rem;
		}
		.group-container {
			gap: 1.25rem;
		}
		.group-content {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		.top-shadow {
			top: 3.25rem;
		}

		.bottom-info {
			flex-direction: column !important;
		}

		[data-card] {
			min-width: 165px;
		}
	}

	&.breakpoint-md {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 902px;
			padding-right: 1.5rem;
			padding-left: 1.5rem;
		}
		.top-shadow {
			top: 3.25rem;
		}
		.group-container {
			gap: 1.25rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 0.75rem;
		}

		[data-card] {
			min-width: 171px;
		}
	}

	&.breakpoint-lg {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1173px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-card] {
			min-width: 188px;
		}
	}

	&.breakpoint-xl {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1144px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}
		[data-card] {
			min-width: 188px;
		}
	}

	&.breakpoint-2xl {
		.groups,
		.top-menu,
		.bottom-info,
		.search-container {
			max-width: 1144px;
			padding-right: 2.25rem;
			padding-left: 2.25rem;
		}
		.top-shadow {
			top: 3.7rem;
		}
		.group-container {
			gap: 1.5rem;
		}
		.group-content {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-card] {
			min-width: 188px;
		}
	}

	[data-catalog-card],
	[data-folder] {
		width: 100%;
	}
`;
