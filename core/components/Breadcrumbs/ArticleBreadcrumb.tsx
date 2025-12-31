import Icon from "@components/Atoms/Icon";
import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsMobileService from "@core-ui/ContextServices/isMobileService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import getArticleItemLink from "@ext/article/LinkCreator/logic/getArticleItemLink";
import ItemMenu from "@ext/item/EditMenu";
import t from "@ext/localization/locale/translate";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import Properties from "@ext/properties/components/Properties";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { Button } from "@ui-kit/Button";
import { useRef, useState } from "react";

interface ArticleBreadcrumbProps {
	className?: string;
	itemLinks: ItemLink[];
	hasPreview: boolean;
}

const ArticleBreadcrumb = ({ className, itemLinks }: ArticleBreadcrumbProps) => {
	const linksRef = useRef<HTMLDivElement>(null);
	const breadcrumbRef = useRef<HTMLDivElement>(null);
	const { articleProperties, setArticleProperties } = PropertyServiceProvider.value;
	const isMobile = IsMobileService.value;

	const [itemLink, setItemLink] = useState<ItemLink>(null);

	const pageData = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const isReadOnly = pageData?.conf.isReadOnly;

	useWatch(() => {
		const newItemLink = getArticleItemLink(itemLinks, articleProps.ref.path);
		setItemLink(newItemLink);
	}, [articleProps.ref.path]);

	const showArticleActions = !articleProps?.errorCode || articleProps?.errorCode === 500;

	return (
		<div ref={breadcrumbRef} className={className}>
			<LinksBreadcrumb ref={linksRef} itemLinks={itemLinks} />
			{!isReadOnly && showArticleActions && (
				<>
					<div className="article-actions" data-qa="qa-article-actions">
						<NavigationDropdown
							className="article-actions"
							style={{ marginRight: "-2px" }}
							tooltipText={t("article.actions.title")}
							trigger={
								<Button variant="text" size="xs" className="p-0 h-full">
									<Icon code="ellipsis-vertical" style={{ fontSize: "1.7em" }} />
								</Button>
							}
						>
							<ItemMenu
								itemLink={itemLink}
								isCategory={itemLink?.type === ItemType.category}
								setItemLink={setItemLink}
							/>
						</NavigationDropdown>
					</div>
				</>
			)}
			<Properties
				properties={articleProperties}
				setProperties={setArticleProperties}
				hideList={isMobile}
				isReadOnly={isReadOnly}
			/>
		</div>
	);
};

export default styled(ArticleBreadcrumb)`
	position: relative;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	${(p) => p.hasPreview && `& {width: 68%;}`}

	.article-actions {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: end;
		right: 0;
		bottom: -1em;
		margin-right: 4px;
		z-index: var(--z-index-foreground);
		opacity: var(--opacity-darken-element);
	}

	.article-actions i {
		font-size: 22px;
	}

	.article-actions:hover {
		opacity: var(--opacity-active-element);
	}

	${cssMedia.narrow} {
		margin-bottom: 0.25rem;
	}

	@media print {
		display: none;
	}
`;
