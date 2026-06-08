import { usePlatform } from "@core-ui/hooks/usePlatform";
import VersionControlCommentCountSrc from "@ext/markdown/elements/comment/edit/components/CommentCount";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import type { ItemLink } from "../../../../../navigation/NavigationLinks";

export const CommentCountNavExtension = ({ item }: { item: ItemLink }) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	if (isNext || isStatic || isStaticCli) return null;

	const total = useGetTotalCommentsByPathname(item.pathname);
	return <VersionControlCommentCountSrc className="ml-[var(--distance-i-span)]" count={total} />;
};
