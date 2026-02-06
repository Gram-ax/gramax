import { isActive } from "@core-ui/hooks/useAudioRecorder";
import { MicrophonePermission } from "@core-ui/hooks/useMicrophone";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback, useMemo } from "react";

const TranscribeButton = ({ editor }: { editor?: Editor }) => {
	const { micState, micActions, recorderState, recorderActions } = AudioRecorderService.value;
	const { isTauri } = usePlatform();

	const startRecording = useCallback(async () => {
		const stream = await micActions.startRecording();
		if (stream) recorderActions.startRecording(stream);
	}, [micActions, recorderActions]);

	const handleClick = useCallback(async () => {
		if (isActive(recorderState)) {
			recorderActions.stopRecording();
			micActions.stopRecording();
			recorderActions.clearRecording();
			return;
		}

		const needRequestAccess =
			micState.permission === MicrophonePermission.prompt || micState.permission === MicrophonePermission.unknown;

		if (needRequestAccess) {
			const hasAccess = await micActions.requestAccess();
			if (!hasAccess) return;
			await startRecording();
		}

		if (micState.permission === MicrophonePermission.granted) await startRecording();
	}, [micState, micActions, recorderActions, startRecording]);

	const isDisabled = useMemo(() => {
		return (
			!micState.supported ||
			micState.permission === MicrophonePermission.denied ||
			micState.loading ||
			!editor?.isEditable
		);
	}, [micState, editor]);

	const tooltipText = useMemo((): string => {
		if (isActive(recorderState)) return `${t("ai.transcribe.recording")}... (${t("ai.transcribe.reset")})`;
		if (micState.permission === MicrophonePermission.denied)
			return isTauri ? t("ai.transcribe.system-denied") : t("ai.transcribe.browser-denied");
		if (micState.permission === MicrophonePermission.prompt) return t("ai.transcribe.access");
		if (micState.loading || micState.permission === MicrophonePermission.unknown) return t("ai.transcribe.loading");
		if (!micState.supported) return t("ai.transcribe.notSupported");
		if (micState.permission === MicrophonePermission.granted) return t("ai.transcribe.click");

		return t("editor.ai.transcribe");
	}, [micState, recorderState, isTauri]);

	const icon = useMemo(() => {
		if (micState.permission === MicrophonePermission.denied) return "mic-off";
		if (isActive(recorderState)) return "x";
		return "mic";
	}, [micState, recorderState]);

	return (
		<ToolbarToggleButton
			active={isActive(recorderState)}
			disabled={isDisabled}
			onClick={handleClick}
			tooltipText={tooltipText}
		>
			<ToolbarIcon icon={icon} />
		</ToolbarToggleButton>
	);
};

export default TranscribeButton;
