import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import FavoriteCatalogLinkService from "@ext/article/Favorite/components/FavoriteCatalogLinkService";
import { getGesSignInUrl } from "@ext/enterprise/components/SignInEnterprise";
import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import BottomInfo from "./BottomInfo";
import Groups from "./Groups";
import NoneGroups from "./NoneGroups";
import TopMenu from "./TopMenu";

const HomePage = ({ data, className }: { data: HomePageData; className?: string }) => {
	const { isStatic, isStaticCli, isNext } = usePlatform();
	const catalogCount = data.catalogsLinks.length;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const authUrl = getGesSignInUrl(gesUrl, true);
	const isGesUnauthorized = PageDataContextService.value.isGesUnauthorized;
	const breakpoint = useBreakpoint();
	const signInEnterpriseProps = useSignInEnterprise({ authUrl });

	return (
		<div className={`${className} breakpoint-${breakpoint} bg-primary-bg flex flex-col`}>
			<ScrollShadowContainer
				wrapperClassName="flex flex-col shadow-scroll h-full"
				shadowTopClassName="top-shadow"
			>
				<TopMenu catalogLinks={data.catalogsLinks} />
				{isGesUnauthorized ? (
					<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
						<SignInEnterpriseForm authUrl={authUrl} {...signInEnterpriseProps} onlySSO />
					</div>
				) : catalogCount ? (
					<FavoriteCatalogLinkService.Init value={data.catalogsLinks}>
						<Groups
							className="groups"
							section={data.section}
							breadcrumb={data.breadcrumb}
							group={data.group}
						/>
					</FavoriteCatalogLinkService.Init>
				) : (
					<NoneGroups />
				)}
				<BottomInfo />
			</ScrollShadowContainer>
			{!(isStatic || isStaticCli || isNext) && <GlobalAudioToolbar />}
		</div>
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
