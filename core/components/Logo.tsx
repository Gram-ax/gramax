import Url from "@core-ui/ApiServices/Types/Url";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import Link from "./Atoms/Link";
import { ActionLogo, CatalogLogo } from "./CatalogLogo";

const Logo = ({ className }: { className?: string; imageUrl?: string }) => {
	const pageData = PageDataContextService.value;
	const { name, link, title, repositoryName } = useCatalogPropsStore(
		(state) => ({
			name: state.data.name,
			link: state.data?.link,
			title: state.data?.title,
			repositoryName: state.data?.repositoryName,
		}),
		"shallow",
	);
	return (
		<div className={className}>
			<Link href={Url.from(link)}>
				{pageData.conf.logo.imageUrl ? <ActionLogo /> : <CatalogLogo catalogName={name} />}
				<span className="title" title={title}>
					{title || repositoryName}
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
	min-width: 0;

	> a {
		width: 100%;
		display: flex;
		max-width: 100%;
		align-items: center;
		${(p) =>
			p.imageUrl
				? `
        img:hover {
          transform: scale(1.05);
          transition: transform 0.2s;
        }

        .title:hover {
          color: var(--color-primary);
        }
      `
				: `
        &:hover .title {
          color: var(--color-primary);
        }
      `}
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
		height: 1.625rem;
		padding-right: 10px;
		transform: translateZ(0);
	}

	${cssMedia.narrow} {
		max-width: calc(100vw - 136px);
	}
`;
