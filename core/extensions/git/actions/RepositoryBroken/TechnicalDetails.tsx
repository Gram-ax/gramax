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
import type { ComponentProps, ReactNode } from "react";

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

export type ErrorDetailsDialogProps = {
	error: Error;
	trigger: ReactNode;
};

export const ErrorDetailsDialog = ({ error, trigger }: ErrorDetailsDialogProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("technical-details")}</DialogTitle>
					<DialogDescription />
				</DialogHeader>
				<DialogBody className="text-primary-fg" style={{ padding: "0 0 1rem 0" }}>
					<CodeBlock>{error?.message || "no message"}</CodeBlock>
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

const InlineLinkButton = styled.button`
	display: inline;
	padding: 0;
	border: none;
	background: none;
	font: inherit;
	color: inherit;
	text-decoration: underline;
	cursor: pointer;
`;

export type TechnicalDetailsProps = ComponentProps<typeof InlineLinkButton> & {
	error: Error;
};

export const TechnicalDetails = ({ children, error, className, ...props }: TechnicalDetailsProps) => {
	return (
		<ErrorDetailsDialog
			error={error}
			trigger={
				<InlineLinkButton className={`text-muted hover:text-primary-fg ${className ?? ""}`} {...props}>
					{children}
				</InlineLinkButton>
			}
		/>
	);
};

const SingleLineErrorButton = styled.button`
	display: block;
	max-width: 100%;
	padding: 0;
	border: none;
	background: none;
	font-size: 0.85em;
	text-align: left;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: underline;
	cursor: pointer;
`;

export type ErrorLineProps = {
	error: Error;
	className?: string;
};

export const ErrorLine = ({ error, className }: ErrorLineProps) => {
	if (!error?.message) return null;

	return (
		<ErrorDetailsDialog
			error={error}
			trigger={
				<SingleLineErrorButton className={`text-status-error ${className ?? ""}`} title={error.message}>
					{error.message}
				</SingleLineErrorButton>
			}
		/>
	);
};
