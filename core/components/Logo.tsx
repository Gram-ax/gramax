import styled from "@emotion/styled";

import Url from "@core-ui/ApiServices/Types/Url";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { CatalogLink } from "../extensions/navigation/NavigationLinks";
import Link from "./Atoms/Link";
import { CatalogLogo } from "./CatalogLogo";

export const Logo = styled(({ className, catalogLink }: { catalogLink?: CatalogLink; className?: string }) => {
	const catalogProps = CatalogPropsService.value;

	const logo = (
		<>
			<CatalogLogo catalogName={catalogProps.name} style={{ maxHeight: "32px" }} />
			<span className="title" title={catalogProps.title}>
				{catalogProps.title}
			</span>
		</>
	);

	return catalogLink ? (
		<Link href={Url.from(catalogLink)} className={className}>
			{logo}
		</Link>
	) : (
		<a className={className}>
			{logo}
		</a>
	);
})`
	width: 100%;
	display: flex;
	max-width: 75%;
	font-size: 24px;
	margin-top: 1px;
	line-height: 1.5em;
	align-items: center;

	${(p) =>
		p.catalogLink
			? `
	&:hover {
		text-decoration: none;

		.title {
			color: var(--color-primary);
		}
	}`
			: `cursor: auto;`}

	.title {
		overflow: hidden;
		font-weight: 300;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--color-primary-general);
	}
	img {
		vertical-align: middle;
		display: inline-block;
		max-height: 1.5em;
		margin-right: 10px;
	}
	${cssMedia.narrow} {
		margin-top: 0;
		font-size: 22px;
		img {
			max-height: 1em;
		}
		.appTitle {
			display: none;
		}
	}
`;
