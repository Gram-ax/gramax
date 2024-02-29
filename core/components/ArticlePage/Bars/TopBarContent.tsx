import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import Url from "@core-ui/ApiServices/Types/Url";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import Search from "../../Actions/Modal/Search";
import Link from "../../Atoms/Link";
import { Logo } from "../../Logo";

const TopBarContent = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	return (
		<div className={className}>
			<Logo catalogLink={data.catalogProps.link} className="inner ielogo" />
			<div className="iconWrapper">
				<Search isHomePage={false} catalogLinks={[data.catalogProps.link]} itemLinks={data.itemLinks} />
				<Link href={Url.fromRouter(useRouter(), { pathname: "/" })} dataQa="home-page-button">
					<ButtonLink textSize={TextSize.L} iconCode="home" />
				</Link>
			</div>
		</div>
	);
};

export default styled(TopBarContent)`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.iconWrapper {
		display: flex;
		align-items: center;
		vertical-align: middle;
	}

	div > a:last-child {
		margin-left: var(--distance-actions);
	}
`;
