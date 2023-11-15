import styled from "@emotion/styled";
import { ReactElement, useState } from "react";
import Language from "../extensions/localization/core/model/Language";
import useLocalize from "../extensions/localization/useLocalize";

const Error = styled(
	({
		error,
		className,
		isLogged = false,
		lang,
	}: {
		error: { message: string; stack?: string };
		isLogged?: boolean;
		className?: string;
		lang?: Language;
	}): ReactElement => {
		const [isExpanded, setExpanded] = useState(false);

		error = isLogged ? error : { message: useLocalize("errorOccured", lang), stack: null };
		return (
			<div className={className}>
				<code className="error">
					<span>{error.message}</span>
				</code>
				{!error.stack ? null : isExpanded ? (
					<pre
						style={{
							background: "var(--color-article-bg)",
							color: "var(--color-article-text)",
						}}
					>
						<code>
							<span>{error.stack}</span>
						</code>
					</pre>
				) : (
					<span
						onClick={() => {
							setExpanded(true);
						}}
						className="expand error"
					>
						{useLocalize("errorExpand")}
					</span>
				)}
			</div>
		);
	},
)`
	.expand {
		cursor: pointer;
		margin-left: var(--distance-i-span);
	}
	.expand:hover {
		text-decoration: underline;
	}
`;
export default Error;
