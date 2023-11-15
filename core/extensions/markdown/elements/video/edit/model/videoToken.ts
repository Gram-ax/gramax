import getVideoAttrs from "../../logic/getVideoAttrs";

const video = {
	node: "video",
	getAttrs: (tok) => getVideoAttrs(tok.attrs),
};

export default video;
