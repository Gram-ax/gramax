import { TextSize } from "@components/Atoms/Button/Button";
import ButtonLink from "@components/Molecules/ButtonLink";
import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import { ArticlePageData } from "../../../../logic/SitePresenter/SitePresenter";
import TopBarContent from "../../../ArticlePage/Bars/TopBarContent";
import BarLayout from "../../BarLayout";

const LeftNavigationTop = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const leftNavIsOpen = LeftNavigationIsOpenService.value;
	const narrowMedia = useMediaQuery(cssMedia.narrow);

	const getPadding = () => {
		if (narrowMedia) return "0 20px";
		return leftNavIsOpen ? "0 20px" : "0 30px";
	};

	return (
		<BarLayout className={className} height={64} padding={getPadding()} gap={narrowMedia ? "1rem" : 0}>
			<>
				{narrowMedia && (
					<ButtonLink
						textSize={TextSize.L}
						iconCode={leftNavIsOpen ? "arrow-left-from-line" : "arrow-right-from-line"}
						onClick={() => {
							LeftNavigationIsOpenService.value = !leftNavIsOpen;
						}}
					/>
				)}
				<TopBarContent data={data} />
			</>
		</BarLayout>
	);
};

export default styled(LeftNavigationTop)`
	i {
		width: 1em !important;
	}
`;
