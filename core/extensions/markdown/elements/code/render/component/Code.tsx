import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export default function Code({ children }: { children: string }) {
	const [copped, setCopped] = useState(false);
	const clickToCopyText = t("click-to-copy");
	const copiedText = t("copied");

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
					<Icon code={!copped ? "copy" : "check"} />
				</span>
			</Tooltip>
		</span>
	);
}
