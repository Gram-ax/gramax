import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import VersionControlCommentCountSrc from "@ext/markdown/elements/comment/edit/components/CommentCount";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import { ItemLink } from "../../../../../navigation/NavigationLinks";

const VersionControlCommentCount = styled(VersionControlCommentCountSrc)`
	margin: 0 var(--distance-i-span);
`;

const CommentCountNavExtension = ({ item }: { item: ItemLink }) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	if (isNext || isStatic || isStaticCli) return null;

	const total = useGetTotalCommentsByPathname(item.pathname);
	return <VersionControlCommentCount count={total} />;
};

export default CommentCountNavExtension;
