import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import TextArea from "@components/Atoms/TextArea";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import SelectGES from "@ext/git/actions/Branch/components/MergeRequest/SelectGES";
import SelectGitCommitAuthors from "@ext/git/actions/Branch/components/MergeRequest/SelectGitCommitAuthors";
import { CreateMergeRequest, MergeRequestOptions, Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

interface MergeRequestModalProps {
	isEnterprise: boolean;
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onClose?: () => void;
}

const CreateMergeRequestModal = ({
	sourceBranchRef,
	targetBranchRef,
	onSubmit,
	onClose,
	isEnterprise,
}: MergeRequestModalProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const [approvers, setApprovers] = useState<Signature[]>([]);
	const [description, setDescription] = useState("");
	const [mergeRequestOptions, setMergeRequestOptions] = useState<MergeRequestOptions>(null);

	const assembleMergeRequest = (): CreateMergeRequest => {
		return {
			approvers: approvers,
			targetBranchRef,
			description,
			options: mergeRequestOptions,
		};
	};

	const onCurrentSubmit = () => {
		if (buttonDisabled) return;
		onSubmit(assembleMergeRequest());
	};

	const buttonDisabled = !approvers.length;

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setIsOpen(false);
				onClose?.();
			}}
			onCmdEnter={onCurrentSubmit}
		>
			<ModalLayoutLight>
				<FormStyle>
					<fieldset>
						<legend>
							<IconWithText iconCode="git-pull-request-arrow" text={t("git.merge-requests.create")} />
						</legend>

						<div className="form-group">
							<div
								className="article field"
								style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
							>
								<span>{t("git.merge.branches")}</span>
								<FormattedBranch name={sourceBranchRef} />
								<span>
									<Icon code="arrow-right" />
								</span>
								<FormattedBranch name={targetBranchRef} />
							</div>
						</div>

						<div className="form-group">
							<div className="picker">
								<label className="control-label picker-text">
									<span>{t("git.merge-requests.approvers")}</span>
									<span className="required">*</span>
								</label>
								{isEnterprise ? (
									<SelectGES
										approvers={approvers}
										onChange={(reviewers) => {
											setApprovers(
												reviewers.map((reviewer) => ({
													name: reviewer.name,
													email: reviewer.email,
												})),
											);
										}}
									/>
								) : (
									<SelectGitCommitAuthors
										approvers={approvers}
										shouldFetch={isOpen}
										onChange={(reviewers) => {
											setApprovers(
												reviewers.map((reviewer) => ({
													name: reviewer.name,
													email: reviewer.email,
												})),
											);
										}}
									/>
								)}
							</div>
						</div>

						<div className="form-group">
							<label className="control-label picker-text">
								<span>{t("description")}</span>
							</label>
							<div className="field field-string row">
								<TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
							</div>
						</div>

						<div className="control-label delete-after-merge-checkbox">
							<Checkbox
								overflow="hidden"
								onClick={(value) => setMergeRequestOptions({ deleteAfterMerge: value })}
							>
								<div className="control-label picker-text" data-qa="qa-clickable">
									<span>{t("git.merge.delete-branch-after-merge")}</span>
								</div>
							</Checkbox>
						</div>

						<div className="buttons">
							<Button onClick={() => setIsOpen(false)} buttonStyle={ButtonStyle.underline}>
								<span>{t("cancel")}</span>
							</Button>
							<Button disabled={buttonDisabled} onClick={onCurrentSubmit}>
								<IconWithText
									iconCode="git-pull-request-arrow"
									text={t("git.merge-requests.create-request")}
								/>
							</Button>
						</div>
					</fieldset>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

export default CreateMergeRequestModal;
