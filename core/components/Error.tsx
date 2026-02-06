import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ReactElement, useState } from "react";

interface ErrorProps {
	error: { message: string; stack?: string };
	isLogged?: boolean;
	className?: string;
}

const Error = (props: ErrorProps): ReactElement => {
	const { error, className } = props;
	const [isExpanded, setExpanded] = useState(false);

	const displayedError = error;

	return (
		<div className={className}>
			<code className="error">
				<span>{displayedError.message}</span>
			</code>
			{!displayedError.stack ? null : isExpanded ? (
				<pre
					style={{
						background: "var(--color-article-bg)",
						color: "var(--color-article-text)",
					}}
				>
					<code>
						<span>{displayedError.stack}</span>
					</code>
				</pre>
			) : (
				<span
					className="expand error"
					onClick={() => {
						setExpanded(true);
					}}
				>
					{t("error-expand")}
				</span>
			)}
		</div>
	);
};

export default styled(Error)`
	.expand {
		cursor: pointer;
		margin-left: var(--distance-i-span);
	}
	.expand:hover {
		text-decoration: underline;
	}
`;
