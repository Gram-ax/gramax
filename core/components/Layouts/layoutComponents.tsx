import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { TitledLink } from "../../extensions/navigation/NavigationLinks";
import Divider from "../Atoms/Divider";
import Icon from "../Atoms/Icon";
import Anchor from "../controls/Anchor";

const RenderTitledLink = ({ link }: { link: TitledLink }): JSX.Element => {
	const Item = (
		<>
			<Icon code={link.icon} prefix={link.iconPrefix as any} faFw={true} />
			<span>
				{link.title}
				{link.childrens ? <RenderTitledLinks links={link.childrens} isChildren={true} /> : null}
			</span>
		</>
	);
	return (
		<Anchor href={link.url} target={link.target}>
			{Item}
		</Anchor>
	);
};

const RenderTitledLinks = ({
	links,
	isCatalog,
	isChildren,
}: {
	links: TitledLink[];
	isCatalog?: boolean;
	isChildren?: boolean;
}): JSX.Element => {
	if (isChildren)
		return (
			<>
				{links.map((link, idx) => (
					<>
						{idx != 0 ? "/" : ""}
						<RenderTitledLink link={link} />
					</>
				))}
			</>
		);

	return (
		<>
			{links.map((link, key) =>
				!Object.keys(link).length ? (
					<Divider key={key} className="divider" />
				) : (
					<li
						key={key}
						onClick={link.onClick}
						data-qa={`${isCatalog ? "catalog" : "article"}-${link.icon}-button`}
					>
						<RenderTitledLink link={link} />
					</li>
				),
			)}
		</>
	);
};

export const Links = styled(
	({
		articleLinks = [],
		articleChildren,
		catalogLinks = [],
		catalogChildren,
		className,
	}: {
		articleLinks?: TitledLink[];
		catalogLinks?: TitledLink[];
		articleChildren?: JSX.Element;
		catalogChildren?: JSX.Element;
		className?: string;
	}) => {
		const isLogged = PageDataContextService.value.isLogged;
		return (
			<ul className={className}>
				<Divider />
				<ul className={className}>
					<RenderTitledLinks isCatalog={false} links={articleLinks} />
					{articleChildren}
				</ul>
				{isLogged && (
					<>
						<Divider />
						<ul className={className}>
							<RenderTitledLinks isCatalog={true} links={catalogLinks} />
							{catalogChildren}
						</ul>
					</>
				)}
			</ul>
		);
	},
)`
	margin-left: -20px !important;

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

	> li,
	.divider {
		line-height: 1.2em !important;
		margin-bottom: 0.9rem !important;
		padding-left: 1.25rem;
	}

	.fa-fw {
		margin-left: -1.25rem;
	}
`;
