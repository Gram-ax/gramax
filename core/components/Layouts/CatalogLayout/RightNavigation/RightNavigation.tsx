import ArticlePageActions from "@components/Article/ArticlePageActions";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import IconLink from "@components/Molecules/IconLink";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { getCatalogLinks, useGetArticleLinks } from "@core-ui/getRigthSidebarLinks";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import SwitchFilteredCatalog from "@ext/CatalogPropertyFilter/SwitchFilteredCatalog";
import SwitchContentLanguage from "@ext/localization/actions/SwitchContentLanguage";
import t from "@ext/localization/locale/translate";
import TableOfContents from "@ext/navigation/article/render/TableOfContents";
import PublishStatusPanel from "@ext/static/components/PublishStatusPanel";
import SwitchVersion from "@ext/versioning/components/SwitchVersion";
import { useRef } from "react";
import Links from "../../layoutComponents";
import { QuizNavigationInfo } from "@ext/quiz/components/QuizNavigationInfo";

const RightNavigation = ({ className }: { className?: string }): JSX.Element => {
	const ref = useRef<HTMLDivElement>(null);
	const articleProps = ArticlePropsService.value;
	const showArticleActions = !(articleProps?.errorCode && articleProps.errorCode !== 500);
	const articleLinks = useGetArticleLinks();
	const { isNext } = usePlatform();
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;

	return (
		<div
			ref={ref}
			className={"article-right-sidebar"}
			style={{ display: "flex", flexDirection: "column", flexGrow: "1" }}
		>
			<aside className={className}>
				<ArticlePageActions />
				<Links
					catalogChildren={
						<>
							<li style={{ listStyleType: "none", width: "fit-content" }}>
								<SwitchFilteredCatalog />
							</li>
							<li style={{ listStyleType: "none", width: "fit-content" }}>
								<SwitchVersion />
							</li>
							<li style={{ listStyleType: "none", width: "fit-content" }}>
								<SwitchContentLanguage />
							</li>
						</>
					}
				/>
				{showArticleActions && <TableOfContents />}
				<Links articleLinks={articleLinks} catalogLinks={getCatalogLinks()} />
				{cloudServiceUrl && <PublishStatusPanel />}
				<QuizNavigationInfo />
			</aside>
			{isNext && (
				<div className={"gramax-link"}>
					<Button buttonStyle={ButtonStyle.transparent} textSize={TextSize.XS}>
						<IconLink
							className={"gramax-link-text"}
							href={"https://gram.ax/"}
							text={t("created-in-gramax")}
							isExternal
						/>
					</Button>
				</div>
			)}
		</div>
	);
};

export default styled(RightNavigation)`
	width: 100%;
	color: var(--color-primary-general);
	background-color: var(--color-right-nav-bg);

	i {
		font-size: 13px;
		margin-left: -1px;
	}

	ul {
		list-style-type: none;
		margin-left: 0;
	}

	ul li {
		font-size: 12px;
	}

	+ .gramax-link {
		width: 100%;
		display: flex;
		justify-content: end;
		align-items: end;

		flex: 1 1 auto;
		margin-top: 2em;

		.gramax-link-text {
			opacity: 0.6;
			:hover {
				opacity: 1;
			}
		}
	}

	a {
		font-weight: 300;
		color: var(--color-primary-general);
		text-decoration: none;

		&:hover {
			color: var(--color-primary);
		}
	}

	${cssMedia.medium} {
		opacity: 0.8;
	}
`;
