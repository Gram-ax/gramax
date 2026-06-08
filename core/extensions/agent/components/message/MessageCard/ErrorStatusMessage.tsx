import { ErrorMessage } from "@ext/git/actions/RepositoryBroken/TechnicalDetails";
import type { Ref } from "react";

export interface ErrorStatusMessageProps {
	statusText: string;
	responseRef?: Ref<HTMLDivElement>;
}

export function ErrorStatusMessage({ statusText, responseRef }: ErrorStatusMessageProps) {
	return (
		<div className="flex w-full min-w-0 items-center" ref={responseRef}>
			<ErrorMessage className="text-status-error text-sm">{statusText}</ErrorMessage>
		</div>
	);
}
