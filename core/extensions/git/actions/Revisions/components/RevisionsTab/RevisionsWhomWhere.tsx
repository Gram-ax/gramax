import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import RevisionsListLayout from "@ext/git/actions/Revisions/components/RevisionsListLayout";
import FromWhere from "@ext/git/core/GitMergeRequest/components/Elements/FromWhere";
import GitVersionData from "@ext/git/core/model/GitVersionData";

interface RevisionsWhomWhereProps {
	revisions: GitVersionData[];
	currentRevision: string;
	shouldLoadMoreAtScrollEnd: boolean;
	requestMore?: (lastRevision: string) => void | Promise<void>;
	onClick?: (revision: string) => void;
}

const RevisionsWhomWhere = (props: RevisionsWhomWhereProps) => {
	const { revisions, currentRevision, onClick, shouldLoadMoreAtScrollEnd, requestMore } = props;
	const currentBranch = BranchUpdaterService.branch?.name;

	return (
		<FromWhere
			fromComponent={<FormattedBranch name={currentBranch} />}
			whereComponent={
				<RevisionsListLayout
					revisions={revisions}
					currentRevision={currentRevision}
					onClick={onClick}
					shouldLoadMoreAtScrollEnd={shouldLoadMoreAtScrollEnd}
					requestMore={requestMore}
				/>
			}
		/>
	);
};

export default RevisionsWhomWhere;
