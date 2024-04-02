import Anchor from "@components/controls/Anchor";
import { ReactNode } from "react";
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

	const onClickHandler = () => {
		void downloadResource(apiUrlCreator, new Path(resourcePath));
	};

	if (!isFile) return <Anchor href={null} {...otherProps} resourcePath={resourcePath} />;

	return <a onClick={onClickHandler}>{otherProps.children}</a>;
};

export default Link;
