import Url from "@core-ui/ApiServices/Types/Url";
import styled from "@emotion/styled";
import { useRouter } from "../../../logic/Api/useRouter";
import { ArticleData } from "../../../logic/SitePresenter/SitePresenter";
import Search from "../../Actions/Modal/Search";
import Icon from "../../Atoms/Icon";
import Link from "../../Atoms/Link";
import { Logo } from "../../Logo";

const TopBarContent = styled(({ data, className }: { data: ArticleData; className?: string }) => {
	return (
		<div className={className}>
			<Logo catalogLink={data.catalogProps.link} className="inner ielogo" />
			<div>
				<Search isHomePage={false} catalogLinks={[data.catalogProps.link]} itemLinks={data.itemLinks} />
				<Link
					href={Url.fromRouter(useRouter(), { pathname: "/" })}
					dataQa="home-page-button"
					className="home-icon"
				>
					<Icon isAction code="home" />
				</Link>
			</div>
		</div>
	);
})`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;

	div > a:last-child {
		margin-left: var(--distance-actions);
	}

	i {
		font-size: var(--big-icon-size);
	}
`;

export default TopBarContent;
