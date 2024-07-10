import Url from "@core-ui/ApiServices/Types/Url";

const trimRoutePrefix = (url: Url) => url.pathname.split("api/").slice(-1)[0];

export default trimRoutePrefix;
