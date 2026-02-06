import Path from "@core/FileProvider/Path/Path";
import { uniqueName } from "@core/utils/uniqueName";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import { isActive } from "@core-ui/hooks/useAudioRecorder";
import styled from "@emotion/styled";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import Visualizer, { VisualizerProps } from "@ext/ai/components/Audio/Visualizer/Visualizer";
import createNameForFile from "@ext/ai/logic/helpers/createNameForFile";
import { MAX_AUDIO_DURATION_MS, MAX_AUDIO_HISTORY_ITEMS } from "@ext/ai/models/consts";
import { AudioHistoryItem } from "@ext/ai/models/types";
import t from "@ext/localization/locale/translate";
import ToolbarWrapper from "@ext/markdown/core/edit/components/Menu/ToolbarWrapper";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import createFile from "@ext/markdown/elements/file/edit/logic/createFile";
import { Editor } from "@tiptap/core";
import { Toolbar } from "@ui-kit/Toolbar";
import { memo, useCallback } from "react";

const Wrapper = styled(ToolbarWrapper)`
	width: 100%;
	margin-bottom: 0.5em;
	opacity: 0;
	animation: fadeIn var(--transition-time) ease-in-out forwards;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const GlobalWrapper = styled.div`
	position: absolute;
	bottom: 3%;
	left: 50%;
	transform: translateX(-50%);
	z-index: var(--z-index-popover);
`;

const AudioToolbar = memo((props: VisualizerProps) => {
	return (
		<Wrapper>
			<Toolbar>
				<ToolbarWrapper className="w-full">
					<Visualizer maxDurationMs={MAX_AUDIO_DURATION_MS} {...props} />
				</ToolbarWrapper>
			</Toolbar>
		</Wrapper>
	);
});

const GlobalAudioToolbar = () => {
	const { recorderState, startTime } = AudioRecorderService.value;
	if (!isActive(recorderState)) return null;

	const onTimeChange = (time: number) => {
		if (time > 0) startTime.current = time;
	};

	const onReset = () => {
		startTime.current = null;
	};

	return (
		<GlobalWrapper>
			<AudioToolbar
				onReset={onReset}
				onTimeChange={onTimeChange}
				sendDisabled
				sendTooltipText={t("ai.transcribe.warningHomeSend")}
				startTime={startTime.current}
			/>
		</GlobalWrapper>
	);
};

const ArticleAudioToolbar = ({ editor }: { editor: Editor }) => {
	const { startTime, recordedAudio } = AudioRecorderService.value;
	const isAiEnabled = editor.storage.ai?.enabled;
	const apiUrlCreator = ApiUrlCreator.value;
	const resourceService = ResourceService.value;

	const onTimeChange = useCallback((time: number) => {
		if (time > 0) startTime.current = time;
	}, []);

	const onReset = useCallback(() => {
		startTime.current = null;
	}, []);

	const insertFile = useCallback(
		(buffer: ArrayBuffer, fileName: string) =>
			editor
				.chain()
				.command(({ view }) => {
					void createFile([new File([buffer], fileName)], view, apiUrlCreator, resourceService);
					return true;
				})
				.run(),
		[editor, apiUrlCreator, resourceService],
	);

	const generateFileName = useCallback((fileName: string, names: string[]) => {
		const path = new Path(fileName);
		if (names.includes(fileName)) return uniqueName(path.name, names, "." + path.extension);
		return fileName;
	}, []);

	const onSend = useCallback(
		(buffer: ArrayBuffer) => {
			startTime.current = null;
			const fileName = generateFileName(
				createNameForFile("wav"),
				recordedAudio.current.map((audio) => audio.name),
			);
			const blob = new Blob([buffer], { type: "audio/wav" });

			if (recordedAudio.current.length >= MAX_AUDIO_HISTORY_ITEMS) recordedAudio.current.shift();
			recordedAudio.current.push({ name: fileName, blob });

			if (!isAiEnabled) return insertFile(buffer, fileName);
			editor.commands.aiTranscribe({ buffer });
		},
		[isAiEnabled, apiUrlCreator, resourceService],
	);

	const onFileClick = useCallback(
		async (audio: AudioHistoryItem) => {
			const buffer = await audio.blob.arrayBuffer();
			insertFile(buffer, audio.name);
		},
		[insertFile],
	);

	return (
		<AudioToolbar
			onFileClick={onFileClick}
			onReset={onReset}
			onSend={onSend}
			onTimeChange={onTimeChange}
			sendTooltipText={editor.storage.ai?.enabled ? t("ai.transcribe.name") : t("save-file")}
			startTime={startTime.current}
		/>
	);
};

export { GlobalAudioToolbar, ArticleAudioToolbar };
