import getPrettifiedText from "./text/getPrettifiedText";
import getGeneratedText from "./text/getGeneratedText";
import checkServer from "./server/checkServer";
import checkAuth from "./server/checkAuth";
import setAiData from "./server/setAiData";
import removeAiData from "./server/removeAiData";
import getAiData from "./server/getAiData";
import transcribe from "./audio/transcribe";

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
