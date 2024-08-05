import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import SnippetViewUses from "@ext/markdown/elements/snippet/edit/components/SnippetViewUses";
import { useState } from "react";

const SnippetAlreadyUseWarn = ({
	articles,
	onDelete,
	onClose,
	onOpen,
}: {
	articles: { pathname: string; title: string }[];
	onDelete: () => Promise<void> | void;
	onOpen?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
}) => {
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
						<p>
							<SnippetViewUses articles={articles} onLinkClick={() => setIsOpen(false)} />
						</p>
						<p>{t("delete-snippet-warn")}.</p>
						<p>{t("continue-confirm")}</p>
					</div>
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default SnippetAlreadyUseWarn;
