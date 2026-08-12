import { PayloadValue } from "../message/ToolPayloadSection";
import { tryParseJson } from "../utils/tryParseJson";

export const AgentContextViewer = ({ json }: { json: string }) => {
	const parsed = tryParseJson(json);

	if (!parsed.ok) {
		return (
			<pre className="w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed m-0">
				{json}
			</pre>
		);
	}

	return <PayloadValue value={parsed.value} />;
};
