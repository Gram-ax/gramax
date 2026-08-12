import type { DiffTreeBreadcrumb } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const Breadcrumbs = ({ breadcrumb, marginLeft }: { breadcrumb: DiffTreeBreadcrumb[]; marginLeft?: number }) => {
	if (!breadcrumb.length) return null;
	const breadcrumbString = breadcrumb.map((b) => b.name).join("/");

	return (
		<div
			className="leading-3 my-[0.2em] text-muted"
			style={{ marginLeft: `${(marginLeft || 0) * 1.05 + 0.15}rem` }}
		>
			<TextOverflowTooltip className="truncate">{breadcrumbString}</TextOverflowTooltip>
		</div>
	);
};

export default Breadcrumbs;
