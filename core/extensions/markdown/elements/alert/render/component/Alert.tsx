import Icon from "@components/Atoms/Icon";
// biome-ignore lint/style/noRestrictedImports: wait ui-kit alert component
import styled from "@emotion/styled";
import { type ReactNode, useEffect, useRef } from "react";

export enum AlertType {
	warning = "warning",
	error = "error",
}

interface AlertProps {
	type?: AlertType;
	title?: string;
	children: ReactNode;
	className?: string;
}

const Alert = styled((props: AlertProps) => {
	const { type = AlertType.warning, title, children, className } = props;
	const alertRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (alertRef.current && alertRef.current.parentElement?.getAttribute("data-focusable") === "true") {
			alertRef.current.removeAttribute("data-focusable");
		}
	}, []);

	return (
		<div className={`${className} admonition alert-${type} admonition-column`} data-focusable="true" ref={alertRef}>
			<div className={"admonition-heading"}>
				<div className="admonition-icon">
					<Icon code={"circle-alert"} strokeWidth="2" />
				</div>
				<div className={"titleWrapper"} suppressContentEditableWarning={true}>
					<div className={"title"}>{title}</div>
				</div>
			</div>
			<div className="admonition-content">{children}</div>
		</div>
	);
})`
	&.alert-warning {
		border-radius: var(--radius-large);
		border: 0.063em solid;
		border-color: hsl(var(--status-warning));
		background: hsl(var(--status-warning-bg));
	}

	&.alert-warning .admonition-heading * {
		color: hsl(var(--status-warning));
	}

	&.alert-error {
		border-radius: var(--radius-large);
		border: 0.063em solid;
		border-color: hsl(var(--status-error));
		background: hsl(var(--status-error-bg));
	}

	&.alert-error .admonition-heading * {
		color: hsl(var(--status-error));
	}

	&.admonition-column .admonition-content {
		padding-left: var(--heading-row-width-admonition);
	}

	.admonition-note,
	.admonition-danger {
		background: transparent;
		border-left: none;
		padding: 0;
	}

	.admonition-note .title,
	.admonition-danger .title {
		font-weight: 400;
	}

	.admonition-content .admonition-icon i {
		margin-inline: -2px;
	}
`;

export default Alert;
