import styled from "@emotion/styled";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogTrigger } from "@ui-kit/Dialog";
import { FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
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
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="p-0" onClick={openModal} variant="link">
					{t("more")}
				</Button>
			</DialogTrigger>
			<DialogContent data-modal-root data-monaco-modal-normal-width>
				<ModalErrorHandler onClose={() => setOpen(false)} onError={console.error}>
					<FormHeader
						description={t("bug-report.tech-details-description")}
						title={t("bug-report.tech-details")}
					/>
					<DialogBody>
						<FormStack>
							<CodeWrapper>
								<CodeBlock language="javascript" value={details} />
							</CodeWrapper>
						</FormStack>
					</DialogBody>
					<FormFooter
						primaryButton={
							<Button onClick={() => setOpen(false)} variant="primary">
								{t("close")}{" "}
							</Button>
						}
					/>
				</ModalErrorHandler>
			</DialogContent>
		</Dialog>
	);
};

export default BugsnagMessageDetails;
