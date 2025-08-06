import styled from "@emotion/styled";
import { useEffect, useState } from "react";

interface TimerProps {
	maxDurationMs: number;
	paused: boolean;
	accumulatedTimeMs: number;
	formatTime: (ms: number) => string;
	onTimeChange?: (time: number) => void;
}

const TimeIndicator = styled.div`
	font-size: 1em;
	font-weight: 500;
	color: var(--color-article-bg);
	background: var(--color-bg);
	padding: 2px 6px;
	border-radius: var(--radius-small);
	white-space: nowrap;
`;

const Timer = ({ formatTime, maxDurationMs, accumulatedTimeMs, paused, onTimeChange }: TimerProps) => {
	const [currentTime, setCurrentTime] = useState(accumulatedTimeMs);

	useEffect(() => {
		if (paused) return;
		const interval = setInterval(() => {
			const newTime = currentTime + 100;
			setCurrentTime(newTime);
			onTimeChange?.(newTime);
		}, 100);
		return () => clearInterval(interval);
	}, [currentTime, paused]);

	return (
		<TimeIndicator>
			{formatTime(currentTime)} / {formatTime(maxDurationMs)}
		</TimeIndicator>
	);
};

export default Timer;
