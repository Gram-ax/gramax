import ButtonLink from "@components/Molecules/ButtonLink";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import { Fragment, type ReactNode } from "react";
import { tv } from "tailwind-variants";
import Divider from "../Atoms/Divider";

interface RenderTitledLinks {
	links: TitledLink[];
	isCatalog?: boolean;
	isChildren?: boolean;
}

const listStyles = tv({
	base: "!-ml-5 text-sm leading-normal text-[var(--color-primary)] list-none",
});

const anchorStyles = tv({
	base: "layout_link inline-flex font-light text-[var(--color-primary-general)] no-underline hover:text-[var(--color-primary)]!",
});

const childrenSpanStyles = tv({
	base: "inline-flex text-sm leading-normal [&_a]:mr-[0.3em] [&_a]:ml-[0.3em] ![&_a:first-of-type]:ml-0 ![&_a:last-child]:mr-0",
});

const RenderTitledLink = ({ link }: { link: TitledLink }): JSX.Element => {
	return (
		<a
			className={anchorStyles()}
			data-qa="qa-clickable"
			href={link.url}
			rel="noreferrer"
			target={link.target ?? "_blank"}
		>
			<ButtonLink iconCode={link.icon} text={link.title} />
			{link.childrens && (
				<span className={childrenSpanStyles()}>
					<RenderTitledLinks isChildren={true} links={link.childrens} />
				</span>
			)}
		</a>
	);
};

const RenderTitledLinks = ({ links, isCatalog, isChildren }: RenderTitledLinks): ReactNode => {
	if (isChildren) {
		return links.map((link, idx) => (
			<Fragment key={link.url}>
				{idx !== 0 ? "/" : ""}
				<RenderTitledLink link={link} />
			</Fragment>
		));
	}

	return links.map((link) =>
		!Object.keys(link).length ? (
			<Divider className="divider" key={link.url} />
		) : (
			<li
				className="!mb-0 !leading-none"
				data-qa={`${isCatalog ? "catalog" : "article"}-${link.icon}-button`}
				key={link.url}
				onClick={link.onClick}
			>
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
		<ul className={listStyles({ className })}>
			{articleLinks?.length || isArticleActionsVisible ? <Divider className="mt-4 mb-4" /> : null}
			<ul className="!mt-0 !mb-0 !pl-5 !-ml-5 list-none">
				<RenderTitledLinks isCatalog={false} links={articleLinks} />
				{articleChildren}
			</ul>
			{catalogLinks?.length || isCatalogActionsVisible ? <Divider /> : null}
			<ul className="!mt-0 !mb-0 !pl-5 !-ml-5 list-none">
				<RenderTitledLinks isCatalog={true} links={catalogLinks} />
				{catalogChildren}
			</ul>
		</ul>
	);
};

export default Links;
