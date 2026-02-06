import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@ui-kit/Modal";

interface CommonUnsupportedElementsModalProps {
	open: boolean;
	unsupportedElements: UnsupportedElements[];
	isLoading?: boolean;
	title?: string;
	description?: string;
	firstColumnTitle?: string;
	secondColumnTitle?: string;
	onOpenChange: (open: boolean) => void;
	renderArticleLink: (article: { title: string; link: string }) => JSX.Element;
	onContinue: () => void;
}

const CommonUnsupportedElementsModal = (props: CommonUnsupportedElementsModalProps) => {
	const {
		open,
		onOpenChange,
		unsupportedElements,
		onContinue,
		isLoading,
		renderArticleLink,
		title,
		description,
		firstColumnTitle,
		secondColumnTitle = t("element"),
	} = props;

	return (
		<Modal onOpenChange={onOpenChange} open={open}>
			<ModalContent showCloseButton={false}>
				<ModalHeader className="flex gap-4" style={{ border: "unset" }}>
					<Icon className="text-status-warning text-2xl" code="circle-alert" />
					<ModalTitle className="text-lg text-status-warning font-medium">{title}</ModalTitle>
				</ModalHeader>
				<ModalBody className="flex flex-row items-start gap-4 lg:py-6">
					<div />
					<div className="flex flex-row gap-6 space-y-2" style={{ marginTop: "-1.5rem" }}>
						<div />
						<div className="article" style={{ background: "transparent" }}>
							{description && <p style={{ margin: "0" }}>{description}</p>}
							<StyledTable>
								<colgroup>
									<col width="50%" />
									<col width="50%" />
								</colgroup>
								<thead>
									<tr>
										<th className="font-medium">{firstColumnTitle}</th>
										<th className="font-medium">{secondColumnTitle}</th>
									</tr>
								</thead>
								<tbody>
									{unsupportedElements.map((element, index) => (
										<>
											<tr key={element.article.id || `article-${index}`}>
												<td
													rowSpan={element.elements.length}
													style={{ verticalAlign: "middle" }}
												>
													{renderArticleLink(element.article)}
												</td>
												<td>
													<p style={{ margin: "0" }}>{element.elements[0].name}</p>
												</td>
											</tr>

											{element.elements.slice(1).map((e, elemIndex) => (
												<tr
													key={`${element.article.id || index}-${elemIndex}`}
													style={{ verticalAlign: "middle" }}
												>
													<td>
														<p style={{ margin: "0" }}>{e.name}</p>
													</td>
												</tr>
											))}
										</>
									))}
								</tbody>
							</StyledTable>
						</div>
					</div>
				</ModalBody>
				<ModalFooter className="flex gap-2 px-4 pb-4 lg:px-6 lg:pb-6" style={{ border: "unset" }}>
					<Button className="ml-auto" onClick={() => onOpenChange(false)} variant="outline">
						{t("cancel")}
					</Button>
					<Button onClick={onContinue} status="warning">
						{isLoading ? (
							<>
								<SpinnerLoader height={16} width={16} />
								{t("loading")}
							</>
						) : (
							t("continue")
						)}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

const StyledTable = styled.table`
	display: table !important;
	margin-top: 0.75em;

	tr:hover {
		background-color: unset !important;
	}

	td,
	th {
		vertical-align: middle !important;
	}

	td[rowspan],
	td[colspan] {
		vertical-align: top !important;
	}
`;

export default CommonUnsupportedElementsModal;
