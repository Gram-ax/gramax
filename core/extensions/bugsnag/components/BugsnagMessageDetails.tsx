import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { useState } from "react";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { JSONContent } from "@tiptap/core";
import styled from "@emotion/styled";

const CodeWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow: scroll;
`;

const BugsnagMessageDetails = ({ getDetails }: { getDetails: () => Promise<JSONContent> }) => {
	const [open, setOpen] = useState(false);
	const [details, setDetails] = useState<string>("{}");

	const openModal = async () => {
		setOpen(true);
		setDetails(JSON.stringify(await getDetails(), null, 4));
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalTrigger asChild>
				<Button variant="link" onClick={openModal} className="p-0">
					{t("more")}
				</Button>
			</ModalTrigger>
			<ModalContent data-modal-root data-monaco-modal-normal-width>
				<ModalErrorHandler onError={console.error} onClose={() => setOpen(false)}>
					<FormHeader
						title={t("bug-report.tech-details")}
						description={t("bug-report.tech-details-description")}
					/>
					<ModalBody>
						<FormStack>
							<CodeWrapper>
								<CodeBlock language="javascript" value={details} />
							</CodeWrapper>
						</FormStack>
					</ModalBody>
					<FormFooter
						primaryButton={
							<Button variant="primary" children={t("close")} onClick={() => setOpen(false)} />
						}
					/>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default BugsnagMessageDetails;
