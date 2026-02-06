import ReformattedSelect from "@components/Select/ReformattedSelect";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
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
			backspaceDelete
			create
			createNewLabel={`${t("git.merge.add-user")} {search}`}
			dropdownHeight="200px"
			loading={authors?.length === 0}
			onChange={onChange}
			options={authors?.map((author) => ({
				value: AuthorInfoCodec.serialize(author),
				label: AuthorInfoCodec.serialize(author),
				name: author.name,
				email: author.email,
			}))}
			placeholder=""
			required
			values={approvers?.map((approver) => ({
				value: AuthorInfoCodec.serialize(approver),
				label: AuthorInfoCodec.serialize(approver),
			}))}
		/>
	);
};

export default SelectGitCommitAuthors;
