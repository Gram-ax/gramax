import type { PropsOf } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { Button } from "@ui-kit/Button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui-kit/Dialog";

export type TechnicalDetailsProps = PropsOf<typeof Button> & {
	error: Error;
};

export const ErrorMessage = styled.div`
	margin-top: 1rem;
	overflow-x: auto;

	pre {
		font-size: 0.8em;
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-x: auto;
		max-width: 100%;
	}
`;

const StyledButton = styled(Button)`
	padding: 0;
	height: auto;
	overflow: visible !important;
`;

export const TechnicalDetails = ({ children, error, ...props }: TechnicalDetailsProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<StyledButton className="underline" size="xl" variant="link" {...props}>
					{children}
				</StyledButton>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("technical-details")}</DialogTitle>
					<DialogDescription />
				</DialogHeader>
				<DialogBody className="text-primary-fg" style={{ padding: "0 0 1rem 0" }}>
					<CodeBlock value={error?.message || "no message"} />
				</DialogBody>
				<DialogFooter className="flex justify-end">
					<DialogClose asChild>
						<Button>{t("close")}</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
