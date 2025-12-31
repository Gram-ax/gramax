import useWatch from "@core-ui/hooks/useWatch";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { AudioHistoryItem } from "@ext/ai/models/types";
import { memo, useMemo, useState } from "react";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";

const AudioHistory = ({ disabled, onClick }: { disabled?: boolean; onClick?: (audio: AudioHistoryItem) => void }) => {
	const { recordedAudio } = AudioRecorderService.value;
	const [history, setHistory] = useState<AudioHistoryItem[]>(recordedAudio.current);
	const isDisabled = disabled || !history.length;

	useWatch(() => {
		setHistory(recordedAudio.current);
	}, [recordedAudio.current]);

	const memoChildren = useMemo(() => {
		return history.map((audio) => (
			<DropdownMenuItem key={audio.name} onSelect={() => onClick?.(audio)}>
				<Icon code="file-audio" />
				{audio.name}
			</DropdownMenuItem>
		));
	}, [history, onClick]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ToolbarToggleButton tooltipText={t("ai.transcribe.history")} disabled={isDisabled}>
					<ToolbarIcon icon="history" />
				</ToolbarToggleButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">{memoChildren}</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default memo(AudioHistory);
