import create from "./create";
import getListIcons from "@app/commands/elements/icon/getIconsList";
import deleteIcon from "./delete";

const icon = { getListIcons, create, delete: deleteIcon };

export default icon;
