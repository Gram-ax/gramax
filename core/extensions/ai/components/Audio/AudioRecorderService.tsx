import ContextService from "@core-ui/ContextServices/ContextService";
import { AudioRecorderActions, AudioRecorderState, isActive, useAudioRecorder } from "@core-ui/hooks/useAudioRecorder";
import { MicrophoneActions, MicrophoneState, useMicrophone } from "@core-ui/hooks/useMicrophone";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { AudioHistoryItem } from "@ext/ai/models/types";
import { createContext, MutableRefObject, ReactElement, useContext, useRef } from "react";

export type AudioRecorderServiceType = {
	micState: MicrophoneState;
	micActions: MicrophoneActions;
	recorderState: AudioRecorderState;
	startTime: MutableRefObject<number>;
	recorderActions: AudioRecorderActions;
	recordedAudio: MutableRefObject<AudioHistoryItem[]>;
};

const AudioRecorderContext = createContext<AudioRecorderServiceType>({
	micState: null,
	micActions: null,
	recorderState: null,
	startTime: null,
	recorderActions: null,
	recordedAudio: null,
});

class AudioRecorderService implements ContextService {
	Init({ children }: { children: ReactElement | ReactElement[] }): ReactElement {
		const { isStatic, isStaticCli } = usePlatform();

		if (isStatic || isStaticCli) return <>{children}</>;
		const [micState, micActions] = useMicrophone();
		const [recorderState, recorderActions] = useAudioRecorder();

		const recordedAudio = useRef<AudioHistoryItem[]>([]);
		const startTime = useRef<number>(null);

		useWatch(() => {
			if (!isActive(recorderState)) startTime.current = null;
			if (isActive(recorderState)) window.onbeforeunload = () => true;
			else window.onbeforeunload = undefined;
		}, [recorderState.state]);

		return (
			<AudioRecorderContext.Provider
				value={{ micState, micActions, recorderState, recorderActions, startTime, recordedAudio }}
			>
				{children}
			</AudioRecorderContext.Provider>
		);
	}

	Provider({
		children,
		value,
	}: {
		children: ReactElement | ReactElement[];
		value: AudioRecorderServiceType;
	}): ReactElement {
		return <AudioRecorderContext.Provider value={value}>{children}</AudioRecorderContext.Provider>;
	}

	get value(): AudioRecorderServiceType {
		const value = useContext(AudioRecorderContext);
		return value;
	}
}

export default new AudioRecorderService();
