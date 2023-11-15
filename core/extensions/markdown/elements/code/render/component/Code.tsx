import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { useState } from "react";
import useLocalize from "../../../../../localization/useLocalize";

export default function Code({ children }: { children: string }) {
	const [copped, setCopped] = useState(false);
	const clickToCopyText = useLocalize("clickToCopy");
	const copiedText = useLocalize("copied");

	return (
		<span
			className="inline-code"
			onClick={() => {
				setCopped(true);
				navigator.clipboard.writeText(children);
			}}
			onMouseLeave={() => {
				setCopped(false);
			}}
		>
			<code>{"\u00A0" + children + "\u00A0"}</code>
			<Tooltip content={!copped ? clickToCopyText : copiedText}>
				<span className="copy">
					<Icon code={!copped ? "copy" : "check"} faFw={true} />
				</span>
			</Tooltip>
		</span>
	);
}
