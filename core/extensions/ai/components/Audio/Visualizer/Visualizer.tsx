import styled from "@emotion/styled";
import { useCallback, useEffect, useRef, useState } from "react";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import CanvasVisualizator from "@ext/ai/components/Audio/Visualizer/CanvasVisualizator";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import t from "@ext/localization/locale/translate";
import Timer from "@ext/ai/components/Audio/Timer";
import { isActive, isPaused } from "@core-ui/hooks/useAudioRecorder";
import useWatch from "@core-ui/hooks/useWatch";
import AudioHistory from "@ext/ai/components/Audio/Visualizer/AudioHistory";
import { AudioHistoryItem } from "@ext/ai/models/types";

export interface VisualizerProps {
	startTime?: number;
	maxDurationMs?: number;
	sendDisabled?: boolean;
	sendTooltipText?: string;
	onFileClick?: (audio: AudioHistoryItem) => void;
	onTimeChange?: (time: number) => void;
	onReset?: () => void;
	onSend?: (buffer: ArrayBuffer, transcribe?: boolean) => void;
}

const Container = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--color-edit-menu-button-bg);
	border-radius: var(--radius-normal);
	gap: 0.5em;
	width: 100%;
`;

const EqualizerContainer = styled.div`
	height: 2.15em;
	width: 100%;
`;

const RightContainer = styled.div`
	display: flex;
	align-items: center;
`;

const formatTime = (ms: number): string => {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const Visualizer = (props: VisualizerProps) => {
	const {
		startTime = 0,
		maxDurationMs = 300000,
		sendDisabled = false,
		sendTooltipText,
		onFileClick,
		onTimeChange,
		onReset,
		onSend,
	} = props;

	const { micState, recorderState, recorderActions, micActions } = AudioRecorderService.value;

	const audioContextRef = useRef<AudioContext>(null);
	const analyserRef = useRef<AnalyserNode>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode>(null);

	const [audioHistory, setAudioHistory] = useState<number[]>([]);
	const [limitReached, setLimitReached] = useState(false);
	const [accumulatedTimeMs, setAccumulatedTimeMs] = useState(startTime);
	const [sessionStartTime, setSessionStartTime] = useState<number>(null);

	const historyIntervalRef = useRef<NodeJS.Timeout>(null);
	const accumulatedTimeMsRef = useRef(0);

	useWatch(() => {
		accumulatedTimeMsRef.current = accumulatedTimeMs;
	}, [accumulatedTimeMs]);

	const getCurrentAudioLevel = (): number => {
		if (!analyserRef.current) return 8;

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		const lowFreq = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4;
		const midFreq = dataArray.slice(4, 12).reduce((sum, val) => sum + val, 0) / 8;
		const highFreq = dataArray.slice(12, 20).reduce((sum, val) => sum + val, 0) / 8;

		const weighted = lowFreq * 0.3 + midFreq * 0.5 + highFreq * 0.2;

		const normalized = (weighted / 255) * 24 + 8;
		return Math.max(8, Math.min(32, normalized));
	};

	const handlePlay = async () => {
		if (isPaused(recorderState)) {
			micActions.toggleMicrophone();
			recorderActions.toggleRecording();
			startRecordingVisualization();
		} else {
			setAccumulatedTimeMs(0);
			setSessionStartTime(null);
			const stream = await micActions.startRecording();
			if (stream) recorderActions.startRecording(stream);
		}
	};

	const handlePause = () => {
		micActions.toggleMicrophone();
		recorderActions.toggleRecording();

		if (sessionStartTime) {
			const currentSessionTime = Date.now() - sessionStartTime;
			const totalTimeAtPause = accumulatedTimeMs + currentSessionTime;
			setAccumulatedTimeMs(totalTimeAtPause);
		}

		if (historyIntervalRef.current) {
			clearInterval(historyIntervalRef.current);
			historyIntervalRef.current = null;
		}

		if (sourceRef.current) {
			sourceRef.current.disconnect();
			sourceRef.current = null;
		}

		if (audioContextRef.current && audioContextRef.current.state !== "closed") {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}

		analyserRef.current = null;
	};

	const handleReset = useCallback(() => {
		if (isActive(recorderState)) {
			recorderActions.stopRecording();
			micActions.stopRecording();
		}

		onReset?.();
		setAudioHistory([]);
		setLimitReached(false);
		setAccumulatedTimeMs(0);
		setSessionStartTime(null);
	}, [recorderActions, micActions, onReset, recorderState?.state]);

	useEffect(() => {
		if (!isActive(recorderState)) handleReset();
	}, [recorderState]);

	const startRecordingVisualization = useCallback(() => {
		if (!micState.stream) return;

		try {
			audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
			const audioContext = audioContextRef.current;

			analyserRef.current = audioContext.createAnalyser();
			const analyser = analyserRef.current;
			analyser.fftSize = 64;
			analyser.smoothingTimeConstant = 0.1;
			analyser.minDecibels = -90;
			analyser.maxDecibels = -10;

			sourceRef.current = audioContext.createMediaStreamSource(micState.stream);
			sourceRef.current.connect(analyser);

			if (accumulatedTimeMsRef.current === 0) setAudioHistory([]);

			historyIntervalRef.current = setInterval(() => {
				const level = getCurrentAudioLevel();
				setAudioHistory((prev) => {
					const newHistory = [...prev, level];
					const limitedHistory = newHistory.length > 200 ? newHistory.slice(-200) : newHistory;

					return limitedHistory;
				});
			}, 50);

			const sessionStart = Date.now();
			setSessionStartTime(sessionStart);
		} catch (error) {
			console.error("Error starting recording visualization:", error);
		}
	}, [micState.stream, handleReset]);

	const stopRecordingVisualization = useCallback(() => {
		if (historyIntervalRef.current) {
			clearInterval(historyIntervalRef.current);
			historyIntervalRef.current = null;
		}

		if (sourceRef.current) {
			sourceRef.current.disconnect();
			sourceRef.current = null;
		}

		if (audioContextRef.current && audioContextRef.current.state !== "closed") {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}

		analyserRef.current = null;
	}, []);

	useEffect(() => {
		if (micState.stream && isActive(recorderState) && !isPaused(recorderState)) startRecordingVisualization();
		else if (!isActive(recorderState) && !isPaused(recorderState)) stopRecordingVisualization();

		return () => stopRecordingVisualization();
	}, [micState.stream, recorderState, startRecordingVisualization]);

	useEffect(() => {
		const documentVisibilityChange = () => {
			if (document.visibilityState === "hidden") handlePause();
			else if (document.visibilityState === "visible") handlePlay();
		};

		document.addEventListener("visibilitychange", documentVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", documentVisibilityChange);
		};
	}, [recorderState]);

	const renderVisualization = () => {
		let currentTime = accumulatedTimeMs;

		if (isActive(recorderState) && !isPaused(recorderState) && sessionStartTime) {
			const currentSessionTime = Date.now() - sessionStartTime;
			currentTime += currentSessionTime;
		}

		const isLive = isActive(recorderState) && !isPaused(recorderState);
		const waveSpeed = isLive || currentTime > 0 ? 0.25 : 0.5;

		return (
			<CanvasVisualizator
				audioHistory={audioHistory}
				isRecording={isActive(recorderState)}
				isPaused={isPaused(recorderState)}
				waveSpeed={waveSpeed}
			/>
		);
	};

	const getTooglerIcon = () => {
		if (isPaused(recorderState)) return "play";
		return "pause";
	};

	const getTogglerTooltipText = () => {
		if (limitReached) return t("ai.transcribe.limit-reached");
		if (isActive(recorderState) && !isPaused(recorderState)) return t("ai.transcribe.pause");
		return null;
	};

	const onSendClick = async () => {
		if (isActive(recorderState)) {
			const result = await recorderActions.stopRecording();
			if (result) onSend?.(result.buffer);

			recorderActions.clearRecording();
			micActions.stopRecording();
		}
	};

	const handleTimeClick = useCallback(
		(time: number) => {
			if (time >= maxDurationMs) {
				setLimitReached(true);
				handlePause();
			}

			onTimeChange?.(time);
		},
		[maxDurationMs, handlePause, onTimeChange],
	);

	return (
		<Container>
			<AudioHistory disabled={sendDisabled} onClick={onFileClick} />
			<Button
				icon={getTooglerIcon()}
				disabled={limitReached}
				onClick={isActive(recorderState) && !isPaused(recorderState) ? handlePause : handlePlay}
				tooltipText={getTogglerTooltipText()}
			/>
			<EqualizerContainer>{renderVisualization()}</EqualizerContainer>
			<RightContainer>
				<Timer
					maxDurationMs={maxDurationMs}
					accumulatedTimeMs={accumulatedTimeMs}
					paused={isPaused(recorderState)}
					formatTime={formatTime}
					onTimeChange={handleTimeClick}
				/>
				<Button icon="check" tooltipText={sendTooltipText} disabled={sendDisabled} onClick={onSendClick} />
			</RightContainer>
		</Container>
	);
};

export default Visualizer;
