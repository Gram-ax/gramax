import Url from "@core-ui/ApiServices/Types/Url";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import Link from "./Atoms/Link";
import { CatalogLogo } from "./CatalogLogo";

const Logo = ({ className }: { className?: string }) => {
	const catalogProps = CatalogPropsService.value;

	return (
		<div className={className}>
			<Link href={Url.from(catalogProps.link)}>
				<CatalogLogo catalogName={catalogProps.name} />
				<span className="title" title={catalogProps.title}>
					{catalogProps.title}
				</span>
			</Link>
		</div>
	);
};

export default styled(Logo)`
	flex: 1;
	display: flex;
	font-size: 20px;
	line-height: 28px;
	align-items: center;
	max-width: calc(100% - 60px);

	> a {
		width: 100%;
		display: flex;
		max-width: 100%;
		align-items: center;
	}
	> a:hover {
		text-decoration: none;
		.title {
			color: var(--color-primary);
		}
	}

	.title {
		overflow: hidden;
		font-weight: 400;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--color-primary-general);
	}

	img {
		vertical-align: middle;
		display: inline-block;
		max-height: 1.625rem;
		margin-right: 10px;
	}

	${cssMedia.narrow} {
		max-width: calc(100vw - 136px);
	}
`;
