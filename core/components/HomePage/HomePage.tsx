import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { cssMedia } from "@core-ui/utils/cssUtils";
import registerMetric from "@core-ui/yandexMetric";
import styled from "@emotion/styled";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import BottomInfo from "./BottomInfo";
import Groups from "./Groups";
import TopMenu from "./TopMenu";

export default styled(({ data, className }: { data: HomePageData; className?: string }) => {
	const isMac = IsMacService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const isProduction = PageDataContextService.value.conf.isProduction;
	if (isServerApp && isProduction) registerMetric("home-page", isLogged);

	return (
		<div className={className + (isMac ? "" : " scrollbar-webkit")}>
			<div className="article container">
				<TopMenu catalogLinks={Object.values(data.catalogLinks).flat()} />
				<Groups links={data.catalogLinks} />
				<BottomInfo />
			</div>
		</div>
	);
})`
	height: 100%;
	overflow: auto;

	.group-header {
		margin-bottom: 0.5rem;
	}

	.container {
		display: flex;
		min-height: 100%;
		margin-left: auto;
		margin-right: auto;
		max-width: 86.8rem;
		padding-left: 1rem;
		font-family: Roboto;
		padding-right: 1rem;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		color: var(--color-primary);
		background: var(--color-menu-bg);
	}

	.container img {
		box-shadow: none;
		max-width: 100%;
		max-height: inherit;
		border: 0;
		display: inline;
		margin: 0;
	}

	a {
		font-weight: 300;
		color: var(--color-primary-general);
		text-decoration: none;
		display: inline-block;
		position: relative;
		&:hover {
			color: var(--color-primary) !important;
		}
	}
	${cssMedia.narrow} {
		.container {
			padding-left: 0.5rem;
			padding-right: 0.5rem;
		}

		i + span {
			display: none;
		}
	}
`;
