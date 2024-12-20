import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import Note, { NoteType } from "@ext/markdown/elements/note/render/component/Note";

interface CommonUnsupportedElementsModalProps {
	iconColor: string;
	title: string;
	description: string;
	noteTitle: string;
	firstColumnTitle: string;
	unsupportedNodes: {
		article: { title: string; link: string };
		elements: { name: string; count: number }[];
	}[];
	actionButtonText: string;
	onActionClick: () => void;
	onCancelClick: () => void;
	className?: string;
	renderArticleLink: (article: { title: string; link: string }) => JSX.Element;
}

const CommonUnsupportedElementsModal = (props: CommonUnsupportedElementsModalProps) => {
	const {
		iconColor,
		title,
		description,
		noteTitle,
		firstColumnTitle,
		actionButtonText,
		unsupportedNodes,
		onActionClick,
		onCancelClick,
		className,
		renderArticleLink,
	} = props;

	return (
		<InfoModalForm
			title={title}
			icon={{ code: "circle-alert", color: iconColor }}
			isWarning={false}
			actionButton={{
				onClick: onActionClick,
				text: actionButtonText,
			}}
			onCancelClick={onCancelClick}
		>
			<div className="article">
				{description && <p>{description}</p>}
				<div className={className}>
					<Note type={NoteType.info} collapsed={true} title={noteTitle}>
						<table>
							<thead>
								<tr>
									<th>{firstColumnTitle}</th>
									<th>{t("element")}</th>
								</tr>
							</thead>
							<tbody>
								{unsupportedNodes.map((data, index) => (
									<tr key={index}>
										<td className="break-word">{renderArticleLink(data.article)}</td>
										<td className="break-word">
											<ul>
												{data.elements.map((element, articleIndex) => (
													<li key={articleIndex}>
														{element.name}
														{element.count > 1 ? ` (${element.count})` : ""}
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

export default styled(CommonUnsupportedElementsModal)`
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
