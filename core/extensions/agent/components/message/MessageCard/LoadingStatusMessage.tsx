import { Loader } from "@ui-kit/Loader";
import type { Ref } from "react";

export interface LoadingStatusMessageProps {
	statusText: string;
	responseRef?: Ref<HTMLDivElement>;
}

export function LoadingStatusMessage({ statusText, responseRef }: LoadingStatusMessageProps) {
	return (
		<div className="flex w-full min-w-0 items-center gap-2 text-sm text-muted-foreground" ref={responseRef}>
			<Loader className="px-0" size="sm" />
			<span>{statusText}</span>
		</div>
	);
}
