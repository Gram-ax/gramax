import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import TextArea from "@components/Atoms/TextArea";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import useWatch from "@core-ui/hooks/useWatch";
import validateEmail from "@core/utils/validateEmail";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import SelectGES from "@ext/git/actions/Branch/components/MergeRequest/SelectGES";
import SelectGitCommitAuthors from "@ext/git/actions/Branch/components/MergeRequest/SelectGitCommitAuthors";
import SquashCheckbox from "@ext/git/actions/Branch/components/SquashCheckbox";
import { CreateMergeRequest, MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { Signature } from "@ext/git/core/model/Signature";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

interface MergeRequestModalProps {
	useGesUsersSelect: boolean;
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onOpen?: () => void;
	onClose?: () => void;
	preventSearchAndStartLoading?: boolean;
}

const CreateMergeRequestModal = ({
	preventSearchAndStartLoading = false,
	sourceBranchRef,
	targetBranchRef,
	onSubmit,
	onOpen,
	onClose,
	useGesUsersSelect,
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

	useWatch(() => {
		if (isOpen) onOpen?.();
		else onClose?.();
	}, [isOpen]);

	const buttonDisabled = !approvers.length;

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			onOpen={() => setIsOpen(true)}
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
								{useGesUsersSelect ? (
									<SelectGES
										preventSearchAndStartLoading={preventSearchAndStartLoading}
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
											const additionalReviewers = reviewers.filter((reviewer) =>
												validateEmail(reviewer.value),
											);

											const res = [
												...reviewers
													.filter((reviewer) => !!reviewer.name)
													.map((reviewer) => ({
														name: reviewer.name,
														email: reviewer.email,
													})),
												...additionalReviewers.map((reviewer) => ({
													name: reviewer.value,
													email: reviewer.value,
												})),
											];

											setApprovers(res);
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
								onClick={(value) =>
									setMergeRequestOptions((prev) => ({ ...prev, deleteAfterMerge: value }))
								}
							>
								<div className="control-label picker-text" data-qa="qa-clickable">
									<span>{t("git.merge.delete-branch-after-merge")}</span>
								</div>
							</Checkbox>
						</div>

						<SquashCheckbox
							onClick={(value) => setMergeRequestOptions((prev) => ({ ...prev, squash: value }))}
						/>

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
