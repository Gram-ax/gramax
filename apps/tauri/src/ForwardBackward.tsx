import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import useWatch from "@core-ui/hooks/useWatch";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

const Wrapper = styled.div<{ leftPad?: boolean }>`
	position: absolute;
	${({ leftPad }) =>
		leftPad &&
		css`
			left: 5.3rem;
		`}
	top: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: var(--z-index-base);
	gap: 0 0.3rem;

	> * {
		padding: 0 0.1rem;
	}
`;

const OpacityIcon = styled(Icon)<{ disabled?: boolean }>`
	color: var(--color-primary);

	cursor: pointer;
	opacity: 0.5;

	${({ disabled }) =>
		disabled &&
		css`
			opacity: 0.2;
			cursor: unset;
		`}
`;

const ForwardBackward = () => {
	const [location, setLocation] = useLocation();
	const [history, setHistory] = useState<string[]>([]);
	const [current, setCurrent] = useState<number>(0);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const window = getCurrentWindow();
		const unlisten = window.onResized(async () => {
			setIsFullscreen(await window.isFullscreen());
		});
		return () => void unlisten.then((unlisten) => unlisten());
	}, []);

	useWatch(() => {
		if (history[current] !== location) {
			setHistory((prev) => [...prev.slice(0, current + 1), location]);
			setCurrent((prev) => prev + 1);
		}
	}, [location]);

	const onClick = useCallback(
		(direction: "forward" | "backward") => {
			const offset = direction === "forward" ? 1 : -1;
			const next = current + offset;

			if (next >= 0 && next < history.length) {
				setLocation(history[next]);
				setCurrent(next);
			}
		},
		[history, current, setLocation],
	);

	return (
		<Wrapper leftPad={!isFullscreen}>
			<Tooltip content={t("backward")}>
				<OpacityIcon
					disabled={history.length <= 1 || current == 0}
					onClick={() => onClick("backward")}
					code="arrow-left"
				/>
			</Tooltip>
			<Tooltip content={t("forward")}>
				<OpacityIcon
					disabled={history.length <= 1 || current === history.length - 1 || current == history.length}
					onClick={() => onClick("forward")}
					code="arrow-right"
				/>
			</Tooltip>
		</Wrapper>
	);
};

export default ForwardBackward;
