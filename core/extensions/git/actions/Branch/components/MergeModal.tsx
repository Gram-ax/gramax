import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import BlueBranch from "@ext/git/actions/Branch/components/BlueBranch";
import { MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

interface MergeModalProps {
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequestOptions: MergeRequestOptions) => void;
	onClose?: () => void;
}

const MergeModal = ({ sourceBranchRef, targetBranchRef, onSubmit, onClose }: MergeModalProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const [mergeRequestOptions, setMergeRequestOptions] = useState<MergeRequestOptions>(null);

	const onCurrentSubmit = () => {
		onSubmit(mergeRequestOptions);
	};

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
							<IconWithText
								iconCode="git-pull-request-arrow"
								text={t("git.merge.branches")}
							/>
						</legend>

						<div className="article field" style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
							<span>{t("git.merge.branches")}</span>
							<BlueBranch name={sourceBranchRef} />
							<span>
								<Icon code="arrow-right" />
							</span>
							<BlueBranch name={targetBranchRef} />
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
							<Button onClick={onCurrentSubmit}>
								<IconWithText iconCode="git-pull-request-arrow" text={t("git.merge.merge")} />
							</Button>
						</div>
					</fieldset>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

export default MergeModal;
