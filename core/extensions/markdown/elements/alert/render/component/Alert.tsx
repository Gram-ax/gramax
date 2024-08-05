import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ReactElement, useEffect, useRef } from "react";

export enum AlertType {
	warning = "warning",
	error = "error",
}

interface AlertProps {
	type?: AlertType;
	title?: string;
	children?: ReactElement;
	className?: string;
}

const Alert = styled((props: AlertProps): ReactElement => {
	const { type = AlertType.warning, title, children, className } = props;
	const alertRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (alertRef.current && alertRef.current.parentElement?.getAttribute("data-focusable") === "true") {
			alertRef.current.removeAttribute("data-focusable");
		}
	}, []);

	return (
		<div ref={alertRef} data-focusable="true" className={`${className} admonition alert-${type} admonition-column`}>
			<div className={"admonition-heading"}>
				<div className="admonition-icon">
					<Icon code={"circle-alert"} strokeWidth="2" />
				</div>
				<div suppressContentEditableWarning={true} className={"titleWrapper"}>
					<div className={"title"}>{title}</div>
				</div>
			</div>
			<div className="admonition-content">{children}</div>
		</div>
	);
})`
	&.alert-warning {
		border-radius: 0.5em;
		border: 0.063em solid;
		border-color: var(--color-alert-warning-border);
		background: var(--color-admonition-note-bg);
	}

	&.alert-warning .admonition-heading * {
		color: var(--color-admonition-note-br-h);
	}

	&.alert-error {
		border-radius: 0.5em;
		border: 0.063em solid;
		border-color: var(--color-alert-error-border);
		background: var(--color-admonition-danger-bg);
	}

	&.alert-error .admonition-heading * {
		color: var(--color-admonition-danger-br-h);
	}

	.admonition-content {
		width: 100%;
		overflow-x: auto;
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

	.admonition-content .admonition-icon {
		width: 0.8em;
	}
`;

export default Alert;
