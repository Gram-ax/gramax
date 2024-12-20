import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import TextArea from "@components/Atoms/TextArea";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import Select from "@components/Select/Select";
import BlueBranch from "@ext/git/actions/Branch/components/BlueBranch";
import { CreateMergeRequest, MergeRequestOptions, Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useMemo, useState } from "react";

interface MergeRequestModalProps {
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onClose?: () => void;
}

const assigneesList = [
	{
		value: "Danil Kazanov (danil.kazanov@ics-it.ru)",
		label: "Danil Kazanov (danil.kazanov@ics-it.ru)",
		name: "Danil Kazanov",
		email: "danil.kazanov@ics-it.ru",
	},
	{
		value: "Stanislav Yargunkin (stanislav.yargunkin@ics-it.ru)",
		label: "Stanislav Yargunkin (stanislav.yargunkin@ics-it.ru)",
		name: "Stanislav Yargunkin",
		email: "stanislav.yargunkin@ics-it.ru",
	},
	{
		value: "Stanislav Petrov (stanislav.petrov@ics-it.ru)",
		label: "Stanislav Petrov (stanislav.petrov@ics-it.ru)",
		name: "Stanislav Petrov",
		email: "stanislav.petrov@ics-it.ru",
	},
	{
		value: "Pavel Smirnov (pavel.smirnov@ics-it.ru)",
		label: "Pavel Smirnov (pavel.smirnov@ics-it.ru)",
		name: "Pavel Smirnov",
		email: "pavel.smirnov@ics-it.ru",
	},
	{
		value: "Gramax Test (gramax.server.test@ics-it.ru)",
		label: "Gramax Test (gramax.server.test@ics-it.ru)",
		name: "Gramax Test",
		email: "gramax.server.test@ics-it.ru",
	},
];

const MergeRequestModal = ({ sourceBranchRef, targetBranchRef, onSubmit, onClose }: MergeRequestModalProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const [assignees, setAssignees] = useState<Signature[]>([]);
	const [description, setDescription] = useState("");
	const [mergeRequestOptions, setMergeRequestOptions] = useState<MergeRequestOptions>(null);
	const localStorageAssignees = useMemo(() => {
		const assignees = window?.localStorage.getItem("assignees");
		return assignees ? JSON.parse(assignees) : [];
	}, []);

	const assembleMergeRequest = (): CreateMergeRequest => {
		return {
			assignees,
			targetBranchRef,
			description,
			options: mergeRequestOptions,
		};
	};

	const onCurrentSubmit = () => {
		if (buttonDisabled) return;
		onSubmit(assembleMergeRequest());
	};

	const buttonDisabled = !assignees.length;

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
								<BlueBranch name={sourceBranchRef} />
								<span>
									<Icon code="arrow-right" />
								</span>
								<BlueBranch name={targetBranchRef} />
							</div>
						</div>

						<div className="form-group">
							<div className="picker">
								<label className="control-label picker-text">
									<span>{t("git.merge-requests.assignees")}</span>
									<span className="required">*</span>
								</label>
								<Select
									values={[]}
									options={[...localStorageAssignees, ...assigneesList]}
									placeholder=""
									onChange={(reviewers) => {
										setAssignees(
											reviewers.map((reviewer) => ({
												name: reviewer.name,
												email: reviewer.email,
											})),
										);
									}}
								/>
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

export default MergeRequestModal;
