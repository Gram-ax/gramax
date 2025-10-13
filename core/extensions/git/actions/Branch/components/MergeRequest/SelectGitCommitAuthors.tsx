import ReformattedSelect from "@components/Select/ReformattedSelect";
import useGitCommitAuthors from "@ext/git/actions/Branch/components/useGitCommitAuthors";
import type { Signature } from "@ext/git/core/model/Signature";
import t from "@ext/localization/locale/translate";

interface SelectGitCommitAuthorsProps {
	approvers: Signature[];
	shouldFetch: boolean;
	onChange: (
		reviewers: {
			value: string;
			label: string;
			name: string;
			email: string;
		}[],
	) => void;
}

const SelectGitCommitAuthors = ({ shouldFetch, approvers, onChange }: SelectGitCommitAuthorsProps) => {
	const { authors } = useGitCommitAuthors(shouldFetch);
	return (
		<ReformattedSelect
			create
			backspaceDelete
			createNewLabel={`${t("git.merge.add-user")} {search}`}
			required
			values={approvers?.map((approver) => ({
				value: `${approver.name} <${approver.email}>`,
				label: `${approver.name} <${approver.email}>`,
			}))}
			options={authors?.map((author) => ({
				value: `${author.name} <${author.email}>`,
				label: `${author.name} <${author.email}>`,
				name: author.name,
				email: author.email,
			}))}
			placeholder=""
			onChange={onChange}
			loading={authors?.length === 0}
			dropdownHeight="200px"
		/>
	);
};

export default SelectGitCommitAuthors;
