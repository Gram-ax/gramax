import IsMacService from "@core-ui/ContextServices/IsMac";
import styled from "@emotion/styled";
import Icon from "./Atoms/Icon";

// const Cmd = ({ children }: { children }) => <span className="cmd">{children}</span>;

const getKeyComponent = (key: string, isMac: boolean): JSX.Element | string => {
	const keyComponents = {
		Mod: isMac ? <Icon faFw={true} code="command" /> : "Ctrl",
		Alt: isMac ? <Icon faFw={true} code="option" /> : "Alt",
		Shift: <Icon faFw={true} code="up" />,
		ArrowUp: <Icon faFw={true} code="arrow-up" />,
		ArrowDown: <Icon faFw={true} code="arrow-down" />,
		Enter: <Icon faFw={true} code="arrow-turn-down-left" />,
	};
	return keyComponents[key] ?? key;
};

const HotKey = styled(({ hotKey, className }: { hotKey: string; className?: string }) => {
	const isMac = IsMacService.value;
	const keys = hotKey.split("-");

	return (
		<div className={className}>
			{keys.map((key, i) => (
				<div key={key}>
					{getKeyComponent(key, isMac)}
					{i + 1 == keys.length || isMac ? null : "+"}
				</div>
			))}
		</div>
	);
})`
	gap: 1px;
	display: flex;
	line-height: 100%;
	align-items: center;
	align-content: center;
	color: var(--color-resolve-comment-active-text);
`;

export default HotKey;
