import Icon from "@components/Atoms/Icon";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import SnippetUsages from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetUsages";
import { useState } from "react";

export interface SnippetAlreadyUseWarnProps {
	snippetId: string;
	onDelete: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
	onOpen?: () => Promise<void> | void;
}

const SnippetAlreadyUseWarn = ({ snippetId, onDelete, onClose, onOpen }: SnippetAlreadyUseWarnProps) => {
	const [isOpen, setIsOpen] = useState(true);
	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				setIsOpen(false);
				onClose?.();
			}}
			onOpen={() => {
				setIsOpen(true);
				onOpen?.();
			}}
		>
			<ModalLayoutLight>
				<InfoModalForm
					title={t("deleting-snippet-in-use")}
					onCancelClick={onClose}
					icon={{ code: "circle-exclamation", color: "var(--color-admonition-note-br-h)" }}
					actionButton={{
						onClick: onDelete,
						text: `${t("delete")} ${t("snippet").toLowerCase()}`,
					}}
					isWarning={true}
				>
					<div className="article">
						<p>{t("delete-snippet-desc")}.</p>
						<SnippetUsages
							offset={[10, 0]}
							placement="bottom"
							snippetId={snippetId}
							trigger={
								<a style={{ display: "flex", alignItems: "center" }}>
									<span>{t("view-usage")}</span>
									<Icon code="chevron-down" />
								</a>
							}
						/>
						<p>{t("delete-snippet-warn")}.</p>
						<p>{t("continue-confirm")}</p>
					</div>
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default SnippetAlreadyUseWarn;
