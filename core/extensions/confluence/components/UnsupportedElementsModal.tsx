import Anchor from "@components/controls/Anchor";
import styled from "@emotion/styled";
import UnsupportedElements from "@ext/confluence/actions/Import/model/UnsupportedElements";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

interface UnsupportedElementsModalProps {
	startClone: () => void;
	onCancelClick: () => void;
	unsupportedNodes: UnsupportedElements[];
	className?: string;
}

const UnsupportedElementsModal = (props: UnsupportedElementsModalProps) => {
	const { startClone, onCancelClick, unsupportedNodes, className } = props;
	return (
		<InfoModalForm
			title={t("unsupported-elements-confluence-title")}
			icon={{ code: "circle-alert", color: "var(--color-admonition-note-br-h)" }}
			isWarning={false}
			actionButton={{
				onClick: startClone,
				text: t("continue"),
			}}
			onCancelClick={onCancelClick}
		>
			<div className="article">
				<p>{t("unsupported-elements-confluence1")}</p>
				<div className={className}>
					<Note type={NoteType.info} collapsed={true} title={t("unsupported-elements-confluence2")}>
						<table>
							<thead>
								<tr>
									<th>{t("page")}</th>
									<th>{t("element")}</th>
								</tr>
							</thead>
							<tbody>
								{unsupportedNodes.map((data, index) => (
									<tr key={index}>
										<td className="break-word">
											<Anchor href={data.article.link}>{data.article.title}</Anchor>
										</td>
										<td className="break-word">
											<ul>
												{data.elements.map((element, articleIndex) => (
													<li key={articleIndex}>
														{element.name} ({element.count})
													</li>
												))}
											</ul>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</Note>
				</div>
			</div>
		</InfoModalForm>
	);
};

export default styled(UnsupportedElementsModal)`
	table {
		overflow: hidden;
		padding: 0;
	}

	.admonition-info {
		overflow-x: hidden;
		overflow-y: auto;
		max-height: 50vh;
		margin-top: 0;
		margin-bottom: 0;
	}

	.admonition-content {
		width: 100%;
		overflow: visible;
		padding: 0;
	}

	.break-word {
		width: 50vw;
		word-break: break-word;
	}
`;
