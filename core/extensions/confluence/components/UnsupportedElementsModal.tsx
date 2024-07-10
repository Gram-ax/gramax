import Anchor from "@components/controls/Anchor";
import styled from "@emotion/styled";
import UnsupportedElements from "@ext/confluence/actions/Import/model/UnsupportedElements";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import useLocalize from "@ext/localization/useLocalize";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import Table from "@ext/markdown/elements/table/render/component/Table";

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
			title={useLocalize("unsupportedElementsConfluenceTitle")}
			icon={{ code: "circle-alert", color: "var(--color-admonition-note-br-h)" }}
			isWarning={false}
			actionButton={{
				onClick: startClone,
				text: useLocalize("continue"),
			}}
			onCancelClick={onCancelClick}
		>
			<div className="article">
				<p>{useLocalize("unsupportedElementsConfluence1")}</p>
				<div className={className}>
					<Note type={NoteType.info} collapsed={true} title={useLocalize("unsupportedElementsConfluence2")}>
						<Table>
							<thead>
								<tr>
									<th>{useLocalize("page")}</th>
									<th>{useLocalize("element")}</th>
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
						</Table>
					</Note>
				</div>
			</div>
		</InfoModalForm>
	);
};

export default styled(UnsupportedElementsModal)`
	table {
		width: 100% !important;
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

	.break-word {
		width: 50vw !important;
		word-break: break-word;
	}
`;
