import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export interface MergeRequestConfirmProps {
	sourceBranch: string;
	targetBranch: string;
	deleteAfterMerge: boolean;
	onCancelClick?: () => void | Promise<void>;
	onMergeClick?: () => void | Promise<void>;
}

const MergeRequestConfirm = (props: MergeRequestConfirmProps) => {
	const { sourceBranch, targetBranch, deleteAfterMerge, onCancelClick, onMergeClick } = props;

	const [isOpen, setisOpen] = useState(true);

	const close = () => {
		setisOpen(false);
		ModalToOpenService.resetValue();
	};

	const currenetOnCancelClick = async () => {
		close();
		await onCancelClick?.();
	};

	const currentOnMergeClick = async () => {
		close();
		await onMergeClick?.();
	};

	return (
		<Modal isOpen={isOpen} onClose={close}>
			<ModalLayoutLight>
				<InfoModalForm
					title={t("git.merge-requests.confirm.title")}
					icon={{ code: "alert-circle", color: "var(--color-admonition-note-br-h)" }}
					onCancelClick={currenetOnCancelClick}
					actionButton={{
						onClick: currentOnMergeClick,
						text: t("git.merge.merge"),
					}}
				>
					<p className="article">
						<span
							dangerouslySetInnerHTML={{
								__html: t(
									deleteAfterMerge
										? "git.merge-requests.confirm.body.delete-branch-after-merge"
										: "git.merge-requests.confirm.body.not-delete-branch-after-merge",
								)
									.replaceAll("{{sourceBranch}}", sourceBranch)
									.replaceAll("{{targetBranch}}", targetBranch),
							}}
						/>
					</p>
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default MergeRequestConfirm;
