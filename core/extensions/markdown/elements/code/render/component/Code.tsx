import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

export default function Code({ children }: { children: string }) {
	const [copped, setCopped] = useState(false);
	const clickToCopyText = t("click-to-copy");
	const copiedText = t("copied");
	const copyAllowed = isNavigatorAvailable();

	const onClickHandler = () => {
		if (!copyAllowed) return;
		setCopped(true);
		navigator.clipboard.writeText(children);
	};

	const onMouseLeaveHandler = () => {
		setCopped(false);
	};

	const getTooltipContent = () => {
		return !copped ? clickToCopyText : copiedText;
	};

	return (
		<span className="inline-code" onClick={onClickHandler} onMouseLeave={onMouseLeaveHandler}>
			<code>{children}</code>
			{copyAllowed && (
				<Tooltip content={getTooltipContent()}>
					<span className="copy">
						<Icon code={!copped ? "copy" : "check"} />
					</span>
				</Tooltip>
			)}
		</span>
	);
}
