import { useCallback, useRef, useState } from "react";

const MIME_TYPE = "audio/webm;codecs=opus";
// Chrome supports only this mime type
// https://stackoverflow.com/questions/41613665/does-chrome-not-support-audio-ogg-codecs-opus

export interface AudioRecorderState {
	state: "idle" | "recording" | "paused";
	audioStartDate: Date;
	audioBlob: Blob;
	audioBuffer: ArrayBuffer;
}

export const isRecording = (state: AudioRecorderState): boolean => state.state === "recording";
export const isPaused = (state: AudioRecorderState): boolean => state.state === "paused";
export const isActive = (state: AudioRecorderState): boolean => state.state === "recording" || state.state === "paused";

export interface AudioRecorderActions {
	startRecording: (stream: MediaStream) => void;
	stopRecording: () => Promise<{ blob: Blob; buffer: ArrayBuffer }>;
	toggleRecording: () => void;
	clearRecording: () => void;
}

export const useAudioRecorder = (): [AudioRecorderState, AudioRecorderActions] => {
	const [state, setState] = useState<AudioRecorderState>({
		state: "idle",
		audioStartDate: null,
		audioBlob: null,
		audioBuffer: null,
	});

	const mediaRecorderRef = useRef<MediaRecorder>(null);

	const startRecording = useCallback((stream: MediaStream) => {
		setState((prev) => ({
			...prev,
			state: "recording",
			audioBlob: null,
			audioBuffer: null,
		}));

		const mediaRecorder = new MediaRecorder(stream, {
			mimeType: MIME_TYPE,
		});

		mediaRecorderRef.current = mediaRecorder;

		mediaRecorder.onerror = (error) => {
			console.error("MediaRecorder error:", error);
			setState((prev) => ({ ...prev, state: "idle" }));
		};

		mediaRecorder.start();

		setState((prev) => ({ ...prev, audioStartDate: new Date() }));
	}, []);

	const stopRecording = useCallback((): Promise<{ blob: Blob; buffer: ArrayBuffer }> => {
		return new Promise((resolve) => {
			const mediaRecorder = mediaRecorderRef.current;

			if (!mediaRecorder) {
				resolve(null);
				return;
			}

			mediaRecorder.ondataavailable = async (event) => {
				try {
					const blob = event.data;
					const buffer = await blob.arrayBuffer();

					setState((prev) => ({
						...prev,
						state: "idle",
						audioBlob: blob,
						audioBuffer: buffer,
					}));

					resolve({ blob, buffer });
				} catch (error) {
					console.error("Error converting blob to buffer:", error);
					setState((prev) => ({ ...prev, state: "idle" }));
					resolve(null);
				}
			};

			mediaRecorder.stop();
		});
	}, []);

	const toggleRecording = useCallback(() => {
		const mediaRecorder = mediaRecorderRef.current;
		if (!mediaRecorder || mediaRecorder.state === "inactive") return;
		if (mediaRecorder.state === "paused") {
			mediaRecorder.resume();
			setState((prev) => ({ ...prev, state: "recording" }));
		} else {
			mediaRecorder.pause();
			setState((prev) => ({ ...prev, state: "paused" }));
		}
	}, []);

	const clearRecording = useCallback(() => {
		setState({
			state: "idle",
			audioStartDate: null,
			audioBlob: null,
			audioBuffer: null,
		});
	}, []);

	const actions: AudioRecorderActions = {
		startRecording,
		stopRecording,
		clearRecording,
		toggleRecording,
	};

	return [state, actions];
};
