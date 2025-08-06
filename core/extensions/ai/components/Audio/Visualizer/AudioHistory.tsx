import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import useWatch from "@core-ui/hooks/useWatch";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { AudioHistoryItem } from "@ext/ai/models/types";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { memo, useMemo, useState } from "react";
import t from "@ext/localization/locale/translate";

const AudioHistory = ({ disabled, onClick }: { disabled?: boolean; onClick?: (audio: AudioHistoryItem) => void }) => {
	const { recordedAudio } = AudioRecorderService.value;
	const [history, setHistory] = useState<AudioHistoryItem[]>(recordedAudio.current);
	const isDisabled = disabled || !history.length;

	useWatch(() => {
		setHistory(recordedAudio.current);
	}, [recordedAudio.current]);

	const memoChildren = useMemo(() => {
		return history.map((audio) => (
			<ButtonLink key={audio.name} iconCode="file-audio" text={audio.name} onClick={() => onClick?.(audio)} />
		));
	}, [history, onClick]);

	return (
		<PopupMenuLayout
			placement="top-start"
			trigger={<Button icon="history" tooltipText={t("ai.transcribe.history")} disabled={isDisabled} />}
			openTrigger="click"
			disabled={isDisabled}
		>
			{memoChildren}
		</PopupMenuLayout>
	);
};

export default memo(AudioHistory);
