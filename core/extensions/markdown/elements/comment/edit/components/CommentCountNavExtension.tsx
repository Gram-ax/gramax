import VersionControlCommentCountSrc from "@components/Comments/CommentCount";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { ItemLink } from "../../../../../navigation/NavigationLinks";

const VersionControlCommentCount = styled(VersionControlCommentCountSrc)`
	margin: 0 var(--distance-i-span);
`;

const CommentCountNavExtension = ({ item }: { item: ItemLink }) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	if (isNext || isStatic || isStaticCli) return null;
	return <VersionControlCommentCount count={CommentCounterService.useGetTotalByPathname(item.pathname)} />;
};

export default CommentCountNavExtension;
