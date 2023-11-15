import Anchor from "@components/controls/Anchor";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
import downloadResource from "../../../../../../ui-logic/downloadResource";

const Link = (props: { resourcePath: string; isFile: boolean; children: JSX.Element }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	if (!props.isFile) return <Anchor {...(props as any)} />;
	return <a onClick={() => downloadResource(apiUrlCreator, new Path(props.resourcePath))}>{props.children}</a>;
};

export default Link;
