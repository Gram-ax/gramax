import VersionControlCommentCount from "@components/Comments/CommentCount";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import { ItemLink } from "../../../../../navigation/NavigationLinks";

const CommentCountNavExtension = ({ item }: { item: ItemLink }) => {
	const isLogged = PageDataContextService.value.isLogged;
	const comments = CommentCounterService.value;
	if (!isLogged) return null;
	return <VersionControlCommentCount count={comments?.[item.pathname] ?? 0} />;
};

export default CommentCountNavExtension;
