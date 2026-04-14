import { getExecutingEnvironment } from "@app/resolveModule/env";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useEffect, useState } from "react";

interface HistoryButtonProps {
	canGo: boolean;
	icon: string;
	tooltipText: string;
	onClick: () => void;
}

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
	z-index: var(--z-index-forward-backward);
	gap: 0 0.3rem;

	> * {
		padding: 0 0.1rem;
	}
`;

const HistoryButton = ({ canGo, icon, tooltipText, onClick }: HistoryButtonProps) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<IconButton
					className="h-auto p-0"
					disabled={!canGo}
					icon={icon}
					onClick={onClick}
					size="sm"
					variant="text"
				/>
			</TooltipTrigger>
			<TooltipContent>{tooltipText}</TooltipContent>
		</Tooltip>
	);
};

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

	const updateCanGo = useCallback(() => {
		const nav =
			"navigation" in window
				? (window as Window & { navigation?: { canGoBack: boolean; canGoForward: boolean } }).navigation
				: undefined;
		if (nav) {
			setCanGoBack(nav.canGoBack);
			setCanGoForward(nav.canGoForward);
		} else {
			setCanGoBack(true);
			setCanGoForward(false);
		}
	}, []);

	window.onNavigate = useCallback(
		(_path: string) => {
			updateCanGo();
		},
		[updateCanGo],
	);

	useEffect(() => {
		updateCanGo();
		window.addEventListener("popstate", updateCanGo);
		return () => window.removeEventListener("popstate", updateCanGo);
	}, [updateCanGo]);

	const navigate = useCallback((direction: "forward" | "backward") => {
		if (direction === "backward") history.back();
		if (direction === "forward") history.forward();
	}, []);

	return (
		<TooltipProvider>
			<Wrapper fixedPad leftPad={isFullscreen ? 0.7 : 5.3}>
				<HistoryButton
					canGo={canGoBack}
					icon="arrow-left"
					onClick={() => navigate("backward")}
					tooltipText={t("backward")}
				/>
				<HistoryButton
					canGo={canGoForward}
					icon="arrow-right"
					onClick={() => navigate("forward")}
					tooltipText={t("forward")}
				/>
			</Wrapper>
		</TooltipProvider>
	);
};

export default ForwardBackward;
