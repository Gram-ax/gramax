import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import type { Ref } from "react";
import { formatElapsed } from "../../utils/formatDuration";

export const CancelledStatusMessage = ({
	responseRef,
	durationMs,
}: {
	responseRef?: Ref<HTMLDivElement>;
	durationMs?: number;
}) => {
	const text =
		durationMs !== undefined
			? `${t("agent.stopped-after")} ${formatElapsed(durationMs)}`
			: t("agent.turn-cancelled");
	return (
		<div className="flex w-full min-w-0 flex-col gap-1.5" ref={responseRef}>
			<span className="text-right text-muted text-sm">{text}</span>
			<Divider />
		</div>
	);
};
