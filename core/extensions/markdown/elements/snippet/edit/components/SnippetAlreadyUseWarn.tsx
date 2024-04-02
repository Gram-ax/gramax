import GoToArticle from "@components/Actions/GoToArticle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import useLocalize from "@ext/localization/useLocalize";
import Cut from "@ext/markdown/elements/cut/render/component/Cut";
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
					title={useLocalize("deletingSnippetInUse")}
					onCancelClick={onClose}
					icon={{ code: "circle-exclamation", color: "var(--color-admonition-note-br-h)" }}
					actionButton={{
						onClick: onDelete,
						text: `${useLocalize("delete")} ${useLocalize("snippet").toLowerCase()}`,
					}}
				>
					<div className="article">
						<p>{useLocalize("deleteSnippetDesc")}:</p>
						<Cut expanded={false} text={useLocalize("viewUsage")}>
							<div style={{ width: "fit-content" }}>
								<ul style={{ marginTop: 0 }}>
									{articles.map((a, idx) => (
										<li key={idx}>
											<GoToArticle
												href={a.pathname}
												trigger={<div onClick={() => setIsOpen(false)}>{a.title}</div>}
											/>
										</li>
									))}
								</ul>
							</div>
						</Cut>
						<p>{useLocalize("deleteSnippetWarn")}.</p>
						<p>{useLocalize("continueConfirm")}</p>
					</div>
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default SnippetAlreadyUseWarn;
