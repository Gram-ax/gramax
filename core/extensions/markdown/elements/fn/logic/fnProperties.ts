import { icsAccount } from "./functions/icsAccount/icsAccount";
import IcsAccountInShema from "./functions/icsAccount/IcsAccountIn.schema.json";
import IcsAccountOutShema from "./functions/icsAccount/IcsAccountOut.schema.json";

const fnProperties = {
	"ics.account": {
		func: icsAccount,
		isOnChange: true,
		jsonSchemas: {
			input: IcsAccountInShema,
			output: IcsAccountOutShema,
		},
	},
};

export default fnProperties;
