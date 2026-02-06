import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";
import { historyBackForwardCanGo, historyBackForwardGo } from "./window/commands";

const isMacOsDesktop = getExecutingEnvironment() === "tauri" && navigator.userAgent.includes("Mac");

const Wrapper = styled.div<{ leftPad?: number; fixedPad?: boolean }>`
	@media print {
		display: none;
	}

	position: absolute;
	${(p) =>
		p.fixedPad
			? css`
					left: ${p.leftPad}rem;
			  `
			: css`
					left: max(${p.leftPad}rem, calc(50% - 85.4rem / 2));
			  `}
	top: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: var(--z-index-header-navigation);
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
	if (!isMacOsDesktop) return null;

	const [isFullscreen, setIsFullscreen] = useState(false);
	const [canGoBack, setCanGoBack] = useState(true);
	const [canGoForward, setCanGoForward] = useState(true);

	useEffect(() => {
		const w = getCurrentWindow();
		void w.isFullscreen().then(setIsFullscreen);
		const unlisten = w.onResized(async () => setIsFullscreen(await w.isFullscreen()));
		return () => {
			void unlisten.then((unlisten) => unlisten());
		};
	}, []);

	window.onNavigate = useCallback(async (path: string) => {
		const [canGoBack, canGoForward] = await historyBackForwardCanGo();
		setCanGoBack(canGoBack);
		setCanGoForward(canGoForward);
	}, []);

	const navigate = useCallback(async (direction: "forward" | "backward") => {
		if (direction === "backward") await historyBackForwardGo(false);
		if (direction === "forward") await historyBackForwardGo(true);
	}, []);

	return (
		<Wrapper fixedPad leftPad={isFullscreen ? 0.7 : 5.3}>
			<Tooltip content={t("backward")}>
				<OpacityIcon code="arrow-left" disabled={!canGoBack} onClick={() => navigate("backward")} />
			</Tooltip>
			<Tooltip content={t("forward")}>
				<OpacityIcon code="arrow-right" disabled={!canGoForward} onClick={() => navigate("forward")} />
			</Tooltip>
		</Wrapper>
	);
};

export default ForwardBackward;
