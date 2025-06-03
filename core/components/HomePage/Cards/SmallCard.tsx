import useGetCatalogTitleLogo from "@components/HomePage/Cards/useGetCatalogTitleLogo";
import { classNames } from "@components/libs/classNames";
import Url from "@core-ui/ApiServices/Types/Url";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import Link from "../../Atoms/Link";

const SmallCard = ({
	link,
	className,
	hideLogo = true,
}: {
	hideLogo?: boolean;
	link: CatalogLink;
	className?: string;
}) => {
	const { isStatic } = usePlatform();
	const logo = useGetCatalogTitleLogo(link.name, hideLogo);

	const card = (
		<div className={`catalog-background background`}>
			<div className="catalog">
				<div className="catalog-title-logo" style={logo && { backgroundImage: `url(${logo})` }} />
				<div title={link.description} className={classNames("catalog-texts", { fullWith: !logo })}>
					<div className="catalog-text-logo">{link.title}</div>
					<div className="catalog-text">{link.description}</div>
				</div>
			</div>
		</div>
	);

	if (isStatic)
		return (
			<a data-catalog-card={name} className={className} href={link.pathname}>
				{card}
			</a>
		);
	return (
		<Link data-catalog-card={name} className={className} href={Url.from(link)}>
			{card}
		</Link>
	);
};

export default styled(SmallCard)`
	width: 100%;
	position: relative;

	.background {
		background: ${(p) => (p.link.style ? `var(--color-card-bg-${p.link.style})` : null)};
	}

	.catalog {
		border-radius: inherit;
		height: 8rem;
		padding: calc(1rem - 1px);
		display: flex;
		cursor: pointer;
		overflow: hidden;
		flex-direction: column;
		align-items: flex-start;
		scroll-snap-align: start;
	}

	.catalog-texts {
		width: 68%;

		&.fullWith {
			width: 100%;
		}
	}

	.catalog-text-logo,
	.catalog-text {
		word-break: break-word;
		max-width: 100%;
		overflow-wrap: break-word;
		white-space: normal;
	}

	@media only screen and (max-width: 380px) {
		.catalog {
			padding: calc(0.5rem - 1px);
			height: 7.5rem;
		}
	}
	@media only screen and (max-width: 320px) {
		.catalog {
			padding: calc(1rem - 1px);
			height: 8rem;
		}
	}
`;
