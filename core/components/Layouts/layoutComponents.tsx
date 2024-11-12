import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import { TitledLink } from "@ext/navigation/NavigationLinks";
import { Fragment, ReactNode } from "react";
import Divider from "../Atoms/Divider";
import Anchor from "../controls/Anchor";

interface RenderTitledLinks {
	links: TitledLink[];
	isCatalog?: boolean;
	isChildren?: boolean;
}

const RenderTitledLink = ({ link }: { link: TitledLink }): JSX.Element => {
	return (
		<Anchor className="layout_link" href={link.url} target={link.target} data-qa="qa-clickable">
			<ButtonLink iconCode={link.icon} text={link.title} />
			{link.childrens && <RenderTitledLinks links={link.childrens} isChildren={true} />}
		</Anchor>
	);
};

const RenderTitledLinks = ({ links, isCatalog, isChildren }: RenderTitledLinks): ReactNode => {
	if (isChildren) {
		return links.map((link, idx) => (
			<Fragment key={idx}>
				{idx != 0 ? "/" : ""}
				<RenderTitledLink link={link} />
			</Fragment>
		));
	}

	return links.map((link, key) =>
		!Object.keys(link).length ? (
			<Divider key={key} className="divider" />
		) : (
			<li key={key} onClick={link.onClick} data-qa={`${isCatalog ? "catalog" : "article"}-${link.icon}-button`}>
				<RenderTitledLink link={link} />
			</li>
		),
	);
};

const Links = (props: {
	articleLinks?: TitledLink[];
	catalogLinks?: TitledLink[];
	articleChildren?: JSX.Element;
	isArticleActionsVisible?: boolean;
	catalogChildren?: JSX.Element;
	isCatalogActionsVisible?: boolean;
	className?: string;
}) => {
	const {
		articleLinks = [],
		articleChildren,
		isArticleActionsVisible,
		catalogLinks = [],
		catalogChildren,
		isCatalogActionsVisible,
		className,
	} = props;
	return (
		<ul className={className}>
			{articleLinks?.length || isArticleActionsVisible ? <Divider /> : null}
			<ul className={className}>
				<RenderTitledLinks isCatalog={false} links={articleLinks} />
				{articleChildren}
			</ul>
			{catalogLinks?.length || isCatalogActionsVisible ? <Divider /> : null}
			<ul className={className}>
				<RenderTitledLinks isCatalog={true} links={catalogLinks} />
				{catalogChildren}
			</ul>
		</ul>
	);
};

export default styled(Links)`
	margin-left: -20px !important;

	.layout_link {
		display: inline-flex;
	}

	a:hover {
		color: var(--color-primary);
		text-decoration: none !important;
	}

	span a:first-of-type {
		margin-left: 0 !important;
	}

	span a:last-child {
		margin-right: 0 !important;
	}

	span a {
		margin-right: 0.3em;
		margin-left: 0.3em;
	}

	.icon {
		color: var(--color-primary);
	}

	> ul > li,
	.divider {
		line-height: 1.2em;
		margin-bottom: 0.9rem;
	}

	.fa-fw {
		margin-left: -1.25rem;
	}
`;
