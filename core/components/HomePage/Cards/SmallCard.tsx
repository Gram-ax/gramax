import resolveModule from "@app/resolveModule/frontend";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import ThemeService from "@ext/Theme/components/ThemeService";
import { CatalogLink } from "../../../extensions/navigation/NavigationLinks";
import Link from "../../Atoms/Link";

const SmallCard = ({ link, className, name }: { link: CatalogLink; className?: string; name: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const theme = ThemeService.value;

	const logo = resolveModule("useImage")(apiUrlCreator.getLogoUrl(link.name, theme));

	return (
		<Link data-catalog-card={name} className={className} href={Url.from(link)}>
			<div className={`catalog-background background`}>
				<div className="catalog">
					<div className="catalog-title-logo" style={logo && { backgroundImage: `url(${logo})` }} />
					<div title={link.description} className="catalog-texts">
						<div className="catalog-text-logo">{link.title}</div>
						<div className="catalog-text">{link.description}</div>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default styled(SmallCard)`
	width: 100%;
	position: relative;

	.background {
		background-color: ${(p) => (p.link.style ? `var(--color-card-bg-${p.link.style})` : null)};
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
