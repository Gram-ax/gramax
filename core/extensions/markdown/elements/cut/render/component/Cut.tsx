import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ReactElement, ReactNode, useEffect, useState } from "react";

const Cut = styled(
	({
		text,
		expanded,
		children,
		isInline,
		onUpdate,
		className,
	}: {
		text: string;
		expanded: string;
		children?: ReactNode;
		isInline?: boolean;
		onUpdate?: (isExpanded: boolean) => void;
		className?: string;
	}): ReactElement => {
		const [isExpanded, setExpanded] = useState(expanded?.toString() === "true");
		useEffect(() => {
			setExpanded(expanded?.toString() === "true");
		}, [expanded]);

		return isInline ? (
			<span className={className}>
				<a
					className={"noselect " + (isExpanded ? "bg in-mp" : "")}
					onClick={() => {
						setExpanded(!isExpanded);
						onUpdate?.(!isExpanded);
					}}
				>
					<span>{isExpanded ? "Скрыть" : text}</span>
					<Icon code={"chevron" + (isExpanded ? "-left" : "-right")} />
				</a>
				{isExpanded && <span className="bg">{children}</span>}
			</span>
		) : (
			<div className={`admonition admonition-cut admonition-column`}>
				<div
					className="admonition-heading"
					onClick={() => {
						setExpanded(!isExpanded);
						onUpdate?.(!isExpanded);
					}}
					contentEditable={false}
				>
					<div className="admonition-icon">
						<Icon code={isExpanded ? "chevron-down" : "chevron-right"} faFw />
					</div>
					<h5>{text}</h5>
				</div>
				{isExpanded && (
					<div className="admonition-content">
						<p className="paragraph">{children}</p>
					</div>
				)}
			</div>
		);
	},
)`
	.noselect {
		user-select: none;
		cursor: pointer;

		> span {
			padding-left: 0px;
		}

		> i {
			font-size: 13px;
		}
	}

	.bg {
		background: rgb(0 134 255 / 15%);
		padding-top: 1px;
		padding-bottom: 3.2px;
	}
`;

export default Cut;
