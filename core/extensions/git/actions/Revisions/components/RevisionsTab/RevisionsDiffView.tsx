import DateComponent from "@components/Atoms/Date";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import RevisionOidCopy from "@ext/git/actions/Revisions/components/RevisionsTab/Helpers/RevisionOidCopy";
import { DiffEntries } from "@ext/git/core/Diff/components/Changes/DiffEntries";
import ScrollableDiffEntriesLayout from "@ext/git/core/Diff/components/Changes/ScrollableDiffEntriesLayout";
import { DiffCount } from "@ext/git/core/Diff/components/helpers/DiffCount";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t, { pluralize } from "@ext/localization/locale/translate";
import { AvatarFallback, AvatarLabel, AvatarLabelAvatar, AvatarLabelTitle, getAvatarFallback } from "@ui-kit/Avatar";
import { Divider } from "@ui-kit/Divider";
import { Loader } from "@ui-kit/Loader";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useRef } from "react";

interface RevisionsDiffViewProps {
	revision: string;
	commitData?: GitVersionData;
	diffTree: DiffTree;
	isDiffTreeLoading: boolean;
}

const RevisionsDiffView = (props: RevisionsDiffViewProps) => {
	const { revision, commitData, diffTree, isDiffTreeLoading } = props;
	const scrollableRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const entriesRef = useRef<HTMLDivElement>(null);

	const parentOid = commitData?.parents?.[0];
	const setArticleDiffView = useSetArticleDiffView({ commit: revision }, parentOid ? { commit: parentOid } : "HEAD");

	const filesCount = pluralize(
		diffTree?.data?.length ?? 0,
		{
			one: t("files.one"),
			few: t("files.few"),
			many: t("files.many"),
		},
		false,
	);

	return (
		<div ref={containerRef}>
			<div className="flex items-baseline justify-between p-4 pb-2 w-full">
				<AvatarLabel className="min-w-0 overflow-hidden flex-shrink" size="xs">
					<AvatarLabelAvatar>
						<AvatarFallback uniqueId={commitData.author.email ?? ""}>
							{getAvatarFallback(commitData.author.name ?? commitData.author.email ?? "")}
						</AvatarFallback>
					</AvatarLabelAvatar>
					<AvatarLabelTitle className="min-w-0 overflow-hidden" size="sm">
						<TextOverflowTooltip className="align-bottom whitespace-nowrap">
							{commitData.author.name}
						</TextOverflowTooltip>
					</AvatarLabelTitle>
				</AvatarLabel>
				<DateComponent className="text-xs text-muted whitespace-nowrap ml-auto" date={commitData.timestamp} />
			</div>
			{commitData && (
				<div className="flex flex-col gap-2 px-4 pt-0 pb-3 overflow-hidden">
					<div className="flex items-center gap-2 justify-between">
						<TextOverflowTooltip className="text-sm font-normal">{commitData.summary}</TextOverflowTooltip>
						<RevisionOidCopy value={commitData?.oid}>{commitData?.oid?.slice(0, 7)}</RevisionOidCopy>
					</div>
				</div>
			)}
			<Divider />
			<div className="flex items-center gap-4 p-2 px-4 text-sm">
				<span className="font-medium text-xs text-muted uppercase">{t("git.merge-requests.diff")}</span>
				<DiffCount type="added">+{commitData?.stat?.added}</DiffCount>
				<DiffCount type="deleted">-{commitData?.stat?.deleted}</DiffCount>
				<div className="flex items-center text-muted gap-1 text-xs ml-auto">
					{diffTree?.data?.length} {filesCount}
				</div>
			</div>
			<Divider />
			<div className="text-xs">
				<ScrollableDiffEntriesLayout maxHeight="20vh" ref={scrollableRef}>
					{!isDiffTreeLoading ? (
						<DiffEntries
							changes={diffTree?.data}
							noNegativeMargin
							onClick={setArticleDiffView}
							ref={entriesRef}
							renderCommentsCount
							scrollableRef={scrollableRef}
						/>
					) : (
						<Loader className="p-6" size="md">
							{t("loading")}
						</Loader>
					)}
				</ScrollableDiffEntriesLayout>
			</div>
		</div>
	);
};

export default RevisionsDiffView;
