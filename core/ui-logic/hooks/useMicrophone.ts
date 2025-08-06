import { useCallback, useEffect, useState } from "react";

export enum MicrophonePermission {
	granted = "granted",
	denied = "denied",
	prompt = "prompt",
	unknown = "unknown",
}

export interface MicrophoneState {
	supported: boolean;
	permission: MicrophonePermission;
	loading: boolean;
	stream: MediaStream;
}

export interface MicrophoneActions {
	requestAccess: () => Promise<boolean>;
	startRecording: () => Promise<MediaStream>;
	stopRecording: () => void;
	toggleMicrophone: () => void;
	checkPermission: () => Promise<PermissionState>;
}

export const useMicrophone = (): [MicrophoneState, MicrophoneActions] => {
	const [state, setState] = useState<MicrophoneState>({
		supported: false,
		permission: MicrophonePermission.unknown,
		loading: true,
		stream: null,
	});

	const isMicrophoneSupported = useCallback((): boolean => {
		return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
	}, []);

	const checkPermission = useCallback(async (): Promise<PermissionState> => {
		try {
			const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
			setState((prev) => ({ ...prev, permission: permission.state as MicrophonePermission }));
			return permission.state;
		} catch (error) {
			console.warn("Permissions API not supported", error);
			setState((prev) => ({ ...prev, permission: MicrophonePermission.prompt }));
			return MicrophonePermission.prompt;
		}
	}, []);

	const requestAccess = useCallback(async (): Promise<boolean> => {
		setState((prev) => ({ ...prev, loading: true }));

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => track.stop());

			setState((prev) => ({
				...prev,
				permission: MicrophonePermission.granted,
				loading: false,
			}));
			return true;
		} catch (error) {
			console.warn("Microphone access denied:", error);
			setState((prev) => ({
				...prev,
				permission: MicrophonePermission.denied,
				loading: false,
			}));
			return false;
		}
	}, [state.permission]);

	const startRecording = useCallback(async (): Promise<MediaStream> => {
		if (state.permission !== MicrophonePermission.granted) {
			const hasAccess = await requestAccess();
			if (!hasAccess) return null;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			setState((prev) => ({ ...prev, stream }));
			return stream;
		} catch (error) {
			console.warn("Error starting recording:", error);
			return null;
		}
	}, [state.permission, requestAccess]);

	const stopRecording = useCallback((): void => {
		if (state.stream) {
			state.stream.getTracks().forEach((track) => track.stop());
			setState((prev) => ({ ...prev, stream: null }));
		}
	}, [state.stream]);

	const toggleMicrophone = useCallback(() => {
		if (state.stream) state.stream.getTracks().forEach((track) => (track.enabled = !track.enabled));
	}, [state.stream]);

	useEffect(() => {
		const initMicrophoneState = async () => {
			const supported = isMicrophoneSupported();

			if (!supported) {
				setState((prev) => ({
					...prev,
					supported: false,
					permission: MicrophonePermission.denied,
					loading: false,
				}));
				return;
			}

			const permission = await checkPermission();
			setState((prev) => ({
				...prev,
				supported: true,
				permission: permission as MicrophonePermission,
				loading: false,
			}));
		};

		void initMicrophoneState();

		return () => {
			stopRecording();
		};
	}, []);

	const actions: MicrophoneActions = {
		requestAccess,
		startRecording,
		stopRecording,
		toggleMicrophone,
		checkPermission,
	};

	return [state, actions];
};
