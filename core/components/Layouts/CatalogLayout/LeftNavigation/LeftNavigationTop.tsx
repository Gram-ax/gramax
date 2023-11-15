import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useMediaQuery } from "@mui/material";
import { ArticleData } from "../../../../logic/SitePresenter/SitePresenter";
import TopBarContent from "../../../ArticlePage/Bars/TopBarContent";
import Icon from "../../../Atoms/Icon";
import BarLayout from "../../BarLayout";

const LeftNavigationTop = ({ data }: { data: ArticleData }) => {
	const leftNavIsOpen = LeftNavigationIsOpenService.value;
	const narrowMedia = useMediaQuery(cssMedia.narrow);

	const getPadding = () => {
		if (narrowMedia) return "0 20px";
		return leftNavIsOpen ? "0 20px" : "0 30px";
	};

	return (
		<BarLayout height={64} padding={getPadding()} gap={narrowMedia ? "0.4em" : 0}>
			<>
				{narrowMedia ? (
					<Icon
						faFw
						style={{ fontSize: "var(--big-icon-size)", fontWeight: 300 }}
						isAction
						code={leftNavIsOpen ? "times" : "bars"}
						onClick={() => {
							LeftNavigationIsOpenService.value = !leftNavIsOpen;
						}}
					/>
				) : null}
				<TopBarContent data={data} />
			</>
		</BarLayout>
	);
};

export default LeftNavigationTop;
