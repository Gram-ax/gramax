import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";

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

	useEffect(() => {
		const wv = getCurrentWindow();
		void wv.isFullscreen().then(setIsFullscreen);
		const unlisten = wv.onResized(async () => setIsFullscreen(await wv.isFullscreen()));
		return () => {
			void unlisten.then((unlisten) => unlisten());
		};
	}, []);

	const navigate = useCallback((direction: "forward" | "backward") => {
		if (direction === "backward") return window.history.back();
		if (direction === "forward") return window.history.forward();
	}, []);

	return (
		<Wrapper leftPad={isFullscreen ? 0.7 : 5.3} fixedPad>
			<Tooltip content={t("backward")}>
				<OpacityIcon onClick={() => navigate("backward")} code="arrow-left" />
			</Tooltip>
			<Tooltip content={t("forward")}>
				<OpacityIcon onClick={() => navigate("forward")} code="arrow-right" />
			</Tooltip>
		</Wrapper>
	);
};

export default ForwardBackward;
