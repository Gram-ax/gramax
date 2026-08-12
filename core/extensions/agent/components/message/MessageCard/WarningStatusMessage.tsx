import type { Ref } from "react";

export interface WarningStatusMessageProps {
	statusText: string;
	responseRef?: Ref<HTMLDivElement>;
}

export const WarningStatusMessage = ({ statusText, responseRef }: WarningStatusMessageProps) => {
	return (
		<div className="flex w-full min-w-0 items-center gap-2 text-muted text-sm" ref={responseRef}>
			<span>{statusText}</span>
		</div>
	);
};
