import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useLocalize from "../../../localization/useLocalize";
// import customConfirm from "@core-ui/CustomConfirm";

const Discard = ({
	paths,
	onDiscard,
	onStartDiscard,
	selectedText = false,
}: {
	paths: string[];
	onDiscard?: (paths: string[]) => void;
	onStartDiscard?: (paths: string[]) => void;
	selectedText?: boolean;
}) => {
	const confirmText = useLocalize(selectedText ? "confirmSelectedDiscard" : "confirmDiscard");
	const apiUrlCreator = ApiUrlCreatorService.value;

	const currentOnDiscard = async () => {
		if (onStartDiscard) onStartDiscard(paths);
		const discardUrl = apiUrlCreator.getVersionControlDiscardUrl();
		const response = await FetchService.fetch(discardUrl, JSON.stringify(paths), MimeTypes.json);
		if (!response.ok) return;
		if (onDiscard) onDiscard(paths);
	};

	return (
		<span
			onClick={async () => {
				ArticleUpdaterService.stopLoadingAfterFocus();
				if (await confirm(confirmText)) await currentOnDiscard();
			}}
			style={{ height: "100%" }}
		>
			<a>
				<Icon
					tooltipContent={useLocalize(selectedText ? "discardSelected" : "discard")}
					code="reply"
					style={{ fontSize: "13px", fontWeight: 300 }}
				/>
			</a>
		</span>
	);
};

export default Discard;
