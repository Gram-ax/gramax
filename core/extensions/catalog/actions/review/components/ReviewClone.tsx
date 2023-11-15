import CircularProgressbar from "@components/Atoms/CircularProgressbar";
import Path from "@core/FileProvider/Path/Path";
import { useEffect, useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import cloneHandler from "../../../../git/actions/Clone/logic/cloneHandler";
import Progress from "../../../../storage/models/Progress";
import StorageData from "../../../../storage/models/StorageData";

const ReviewClone = ({
	filePath,
	storageData,
	branch,
	onCloneError = () => {},
}: {
	filePath: string;
	storageData: StorageData;
	branch?: string;
	onCloneError?: () => void;
}) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [progress, setProgress] = useState<Progress>(null);
	const [hasClone, setHasClone] = useState(false);

	useEffect(() => {
		if (!storageData || hasClone) return;
		clone();
		setHasClone(true);
	}, [storageData]);

	const clone = async () => {
		const path = await cloneHandler({
			storageData,
			apiUrlCreator,
			recursive: false,
			branch,
			onProgress: setProgress,
		});
		if (!path) {
			onCloneError();
			return;
		}
		router.pushPath(new Path(path).join(new Path(filePath)).value);
	};

	return <CircularProgressbar value={progress?.percent} />;
};

export default ReviewClone;
