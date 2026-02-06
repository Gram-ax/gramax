import Anchor from "@components/controls/Anchor";
import FetchService from "@core-ui/ApiServices/FetchService";
import t from "@ext/localization/locale/translate";
import { openFilePreview } from "@ext/markdown/elements/file/edit/logic/openFilePreview";
import { toast } from "@ui-kit/Toast";
import type { MouseEvent, ReactNode } from "react";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import downloadResource from "../../../../../../ui-logic/downloadResource";

interface LinkProps {
	resourcePath: string;
	isFile: boolean;
	children: ReactNode;
}

const Link = (props: LinkProps) => {
	const { isFile, resourcePath, ...otherProps } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	if (!isFile) return <Anchor href={null} {...otherProps} resourcePath={resourcePath} />;

	const onClickHandler = async (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const path = new Path(resourcePath);
		const onError = () => {
			toast(t("file-not-found"), {
				status: "error",
				icon: "triangle-alert",
				description: t("file-download-error-message"),
				size: "lg",
			});
		};

		const downloadFile = async () => {
			await downloadResource(apiUrlCreator, path);
		};

		const res = await FetchService.fetch(
			apiUrlCreator.getArticleResource(path.value, null),
			undefined,
			undefined,
			undefined,
			false,
		);
		if (!res.ok) onError();

		const buffer = await res.buffer();
		openFilePreview(buffer, path, { onError, downloadResource: downloadFile });
	};

	return (
		<button className="link" onClick={onClickHandler} type="button">
			{otherProps.children}
		</button>
	);
};

export default Link;
