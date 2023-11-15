import AllPermission from "../Permission/AllPermission";
import User from "./User";

const localUser = new User(true, null, new AllPermission());

export default localUser;
