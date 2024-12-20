import IsMacService from "@core-ui/ContextServices/IsMac";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import BottomInfo from "./BottomInfo";
import Groups from "./Groups";
import TopMenu from "./TopMenu";

export default styled(({ data, className }: { data: HomePageData; className?: string }) => {
	const isMac = IsMacService.value;

	return (
		<div className={className + (isMac ? "" : " scrollbar-webkit")}>
			<div className="article container">
				<TopMenu
					catalogLinks={Object.values(data.catalogLinks).flatMap(
						(catalogData) => catalogData.catalogLinks || [],
					)}
				/>
				<Groups catalogsLinks={data.catalogLinks} />
				<BottomInfo />
			</div>
		</div>
	);
})`
	height: 100%;
	overflow: auto;

	.container {
		display: flex;
		min-height: 100%;
		margin-left: auto;
		margin-right: auto;
		max-width: 86.8rem;
		padding-left: 1rem;
		font-family: Roboto, sans-serif;
		padding-right: 1rem;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		color: var(--color-home-text);
		background: var(--color-home-bg);
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
		color: var(--color-home-card-link);
		text-decoration: none;
		display: inline-block;
		position: relative;

		&:hover {
			color: var(--color-home-card-link-hover) !important;
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
