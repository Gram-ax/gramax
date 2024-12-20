import resolveModule from "@app/resolveModule/frontend";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import Link from "../../Atoms/Link";
import ThemeService from "@ext/Theme/components/ThemeService";

const BigCard = ({ link, className, name }: { link: CatalogLink; className?: string; name: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const theme = ThemeService.value;

	const logo = resolveModule("useImage")(apiUrlCreator.getLogoUrl(link.name, theme));

	return (
		<Link data-catalog-card={name} className={className} href={Url.from(link)}>
			<div className="catalog-background">
				<div className="catalog">
					<div className="catalog-titles">
						<div className="catalog-title gradient">
							{link.code.length <= 4 ? link.code : link.code.slice(0, 3) + "..."}
						</div>
						<div className="catalog-title-logo" style={logo && { backgroundImage: `url(${logo})` }} />
					</div>
					<div title={link.description} className="catalog-texts">
						<div className="catalog-text-logo">{link.title}</div>
						<div className="catalog-text">{link.description}</div>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default styled(BigCard)`
	width: 100%;

	.catalog-background {
		background-color: ${(p) => (p.link.style ? `var(--color-card-bg-${p.link.style})` : null)};
	}

	.catalog {
		display: flex;
		border-radius: inherit;
		height: 11.7rem;
		overflow: hidden;
		padding: calc(1rem - 1px) calc(1.2rem - 1px);
		flex-direction: column;
	}

	.gradient {
		background-image: ${(p) => (p.link.style ? `var(--color-card-gradient-${p.link.style})` : null)};
	}

	.catalog-titles {
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: space-between;
	}

	.catalog-title {
		color: transparent;
		-webkit-background-clip: text;
	}

	@media only screen and (max-width: 380px) {
		.catalog {
			height: 8.7rem;
			padding: calc(0.5rem - 1px) calc(0.7rem - 1px);
		}
	}

	@media only screen and (max-width: 320px) {
		.catalog {
			padding: calc(1rem - 1px) calc(1.2rem - 1px);
			height: 10.7rem;
		}
	}
`;
