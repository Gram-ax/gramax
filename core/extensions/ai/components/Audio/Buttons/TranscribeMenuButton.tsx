import { Editor } from "@tiptap/core";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { MicrophonePermission } from "@core-ui/hooks/useMicrophone";
import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { isActive } from "@core-ui/hooks/useAudioRecorder";
import { usePlatform } from "@core-ui/hooks/usePlatform";

const TranscribeButton = ({ editor }: { editor?: Editor }) => {
	const { micState, micActions, recorderState, recorderActions } = AudioRecorderService.value;
	const { isTauri } = usePlatform();

	const startRecording = async () => {
		const stream = await micActions.startRecording();
		if (stream) recorderActions.startRecording(stream);
	};

	const handleClick = async () => {
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
	};

	const isDisabled =
		!micState.supported ||
		micState.permission === MicrophonePermission.denied ||
		micState.loading ||
		!editor?.isEditable;

	const getTooltipText = (): string => {
		if (isActive(recorderState)) return `${t("ai.transcribe.recording")}... (${t("ai.transcribe.reset")})`;
		if (micState.permission === MicrophonePermission.denied)
			return isTauri ? t("ai.transcribe.system-denied") : t("ai.transcribe.browser-denied");
		if (micState.permission === MicrophonePermission.prompt) return t("ai.transcribe.access");
		if (micState.loading || micState.permission === MicrophonePermission.unknown) return t("ai.transcribe.loading");
		if (!micState.supported) return t("ai.transcribe.notSupported");
		if (micState.permission === MicrophonePermission.granted) return t("ai.transcribe.click");

		return t("editor.ai.transcribe");
	};

	const getIcon = () => {
		if (micState.permission === MicrophonePermission.denied) return "mic-off";
		if (isActive(recorderState)) return "x";
		return "mic";
	};

	return (
		<Tooltip content={getTooltipText()}>
			<Button icon={getIcon()} disabled={isDisabled} onClick={handleClick} isActive={isActive(recorderState)} />
		</Tooltip>
	);
};

export default TranscribeButton;
