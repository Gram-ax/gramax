import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { ItemStatus } from "../../../Watchers/model/ItemStatus";
import { GitStatus } from "./model/GitStatus";

const convertToChangeItem = (changeFiles: GitStatus[], fp: FileProvider): ItemStatus[] =>
	changeFiles.map((changeFile: GitStatus) => ({
		itemRef: fp.getItemRef(changeFile.path),
		type: changeFile.type,
	}));

export default convertToChangeItem;
