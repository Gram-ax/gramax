import CircularProgressbar from "@components/Atoms/CircularProgressbar";
import { Trigger } from "@core-ui/triggers/useTrigger";
import useTriggerEffect from "@core-ui/triggers/useTriggerEffect";
import Path from "@core/FileProvider/Path/Path";
import { useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import Progress from "../../../../storage/models/Progress";
import cloneHandler, { CloneHandlerProps } from "../logic/cloneHandler";

const CloneProgressbar = ({
	triggerClone,
	storageData,
	filePath,
	branch,
	skipCheck,
	recursive,
	onProgress = () => {},
	onStart = () => {},
	onFinish = () => {},
	onError = () => {},
}: {
	triggerClone: Trigger;
	filePath?: string;
} & Omit<CloneHandlerProps, "apiUrlCreator">) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [progress, setProgress] = useState<Progress>(null);
	const [hasClone, setHasClone] = useState(false);

	useTriggerEffect(() => {
		if (!storageData || hasClone) return;
		clone();
		setHasClone(true);
	}, triggerClone);

	const clone = async () => {
		await cloneHandler({
			storageData,
			apiUrlCreator,
			recursive,
			skipCheck,
			branch,
			onProgress: (progress) => {
				setProgress(progress);
				onProgress(progress);
			},
			onStart,
			onFinish: (path) => {
				router.pushPath(new Path(path).join(new Path(filePath)).value);
				onFinish(path);
				setHasClone(false);
			},
			onError,
		});
	};

	return <CircularProgressbar value={progress?.percent} />;
};

export default CloneProgressbar;
