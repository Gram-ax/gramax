import IsMacService from "@core-ui/ContextServices/IsMac";
import styled from "@emotion/styled";
import Icon from "./Atoms/Icon";
import { Fragment } from "react";

// const Cmd = ({ children }: { children }) => <span className="cmd">{children}</span>;

const getKeyComponent = (key: string, isMac: boolean): JSX.Element | string => {
	const keyComponents = {
		Mod: isMac ? <Icon code="command" /> : "Ctrl",
		Alt: isMac ? <Icon code="option" /> : "alt",
		Shift: <Icon code="arrow-big-up" viewBox="3 3 18 18" />,
		ArrowUp: <Icon code="arrow-up" />,
		ArrowDown: <Icon code="arrow-down" />,
		Enter: <Icon code="corner-down-left" />,
	};
	return keyComponents[key] ?? key;
};

const HotKey = ({ hotKey, className }: { hotKey: string; className?: string }) => {
	const isMac = IsMacService.value;
	const keys = hotKey.split("-");
	return (
		<div className={className}>
			{keys.map((key, i) => (
				<Fragment key={key}>
					{getKeyComponent(key, isMac)}
					{i + 1 == keys.length || isMac ? null : "+"}
				</Fragment>
			))}
		</div>
	);
};

export default styled(HotKey)`
	display: flex;
	color: var(--color-resolve-comment-active-text);
`;
