import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import FromWhere from "@ext/git/core/GitMergeRequest/components/Elements/FromWhere";

const MergeRequestFromWhere = ({ from, where }: { from: string; where: string }) => {
	return (
		<FromWhere fromComponent={<FormattedBranch name={from} />} whereComponent={<FormattedBranch name={where} />} />
	);
};

export default MergeRequestFromWhere;
