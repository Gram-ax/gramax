import styled from "@emotion/styled";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { JSONContent } from "@tiptap/core";
import { Button } from "@ui-kit/Button";
import { FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useState } from "react";

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
		<Modal onOpenChange={setOpen} open={open}>
			<ModalTrigger asChild>
				<Button className="p-0" onClick={openModal} variant="link">
					{t("more")}
				</Button>
			</ModalTrigger>
			<ModalContent data-modal-root data-monaco-modal-normal-width>
				<ModalErrorHandler onClose={() => setOpen(false)} onError={console.error}>
					<FormHeader
						description={t("bug-report.tech-details-description")}
						title={t("bug-report.tech-details")}
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
							<Button children={t("close")} onClick={() => setOpen(false)} variant="primary" />
						}
					/>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default BugsnagMessageDetails;
