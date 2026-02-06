import transcribe from "./audio/transcribe";
import checkAuth from "./server/checkAuth";
import checkServer from "./server/checkServer";
import getAiData from "./server/getAiData";
import removeAiData from "./server/removeAiData";
import setAiData from "./server/setAiData";
import getGeneratedText from "./text/getGeneratedText";
import getPrettifiedText from "./text/getPrettifiedText";

export default {
	text: {
		getPrettifiedText,
		getGeneratedText,
	},
	server: {
		checkServer,
		checkAuth,
		setAiData,
		removeAiData,
		getAiData,
	},
	audio: {
		transcribe,
	},
};
