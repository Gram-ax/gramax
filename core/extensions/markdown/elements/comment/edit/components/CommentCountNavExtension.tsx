import VersionControlCommentCount from "@components/Comments/CommentCount";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ItemLink } from "../../../../../navigation/NavigationLinks";

const CommentCountNavExtension = ({ item }: { item: ItemLink }) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	if (isNext || isStatic || isStaticCli) return null;
	return <VersionControlCommentCount count={CommentCounterService.useGetTotalByPathname(item.pathname)} />;
};

export default CommentCountNavExtension;
