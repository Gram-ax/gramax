import TextArea from "@components/Atoms/TextArea";
import SelectGES from "@ext/git/actions/Branch/components/MergeRequest/SelectGES";
import SelectGitCommitAuthors from "@ext/git/actions/Branch/components/MergeRequest/SelectGitCommitAuthors";
import { CreateMergeRequest, Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

interface MergeRequestModalProps {
	isEnterprise: boolean;
	approvers: Signature[];
	setApprovers: (approvers: Signature[]) => void;
	description: string;
	setDescription: (description: string) => void;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onClose?: () => void;
	preventSearchAndStartLoading?: boolean;
}

const MergeRequestForm = (props: MergeRequestModalProps) => {
	const { isEnterprise, approvers, setApprovers, description, setDescription, preventSearchAndStartLoading } = props;

	const selectApprovers = (reviewers: Signature[]) => {
		setApprovers(
			reviewers.map((reviewer) => ({
				name: reviewer.name,
				email: reviewer.email,
			})),
		);
	};

	return (
		<>
			<div className="form-group">
				<div className="picker">
					<label className="control-label picker-text">
						<span>{t("git.merge-requests.approvers")}</span>
						<span className="required">*</span>
					</label>
					{isEnterprise ? (
						<SelectGES
							approvers={approvers}
							onChange={selectApprovers}
							preventSearchAndStartLoading={preventSearchAndStartLoading}
						/>
					) : (
						<SelectGitCommitAuthors approvers={approvers} shouldFetch={true} onChange={selectApprovers} />
					)}
				</div>
			</div>

			<div className="form-group">
				<label className="control-label picker-text">
					<span>{t("description")}</span>
				</label>
				<div className="field field-string row">
					<TextArea
						style={{ resize: "vertical" }}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
			</div>
		</>
	);
};

export default MergeRequestForm;
