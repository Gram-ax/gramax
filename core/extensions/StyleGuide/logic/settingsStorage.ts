import cryptoJS from "crypto-js";
import { AccountSettings } from "../components/StyleGuideAccountSettings";
import { CheckSettings } from "../components/StyleGuideCheckSettings";

const SECRET = "styleGuide";
const STORAGE_CHECK_KEY = "styleGuideCheckSettings";
const STORAGE_ACCOUNT_KEY = "styleGuideAccountSettings";

const encrypt = (value: string): string => {
	return cryptoJS.AES.encrypt(value, SECRET).toString();
};
const decrypt = (value: string): string => {
	return cryptoJS.AES.decrypt(value, SECRET).toString(cryptoJS.enc.Utf8);
};

const settingsStorage = {
	getAccountSettings: (): AccountSettings => {
		const settings = window.localStorage.getItem(STORAGE_ACCOUNT_KEY);
		return settings ? JSON.parse(decrypt(settings)) : null;
	},
	setAccountSettings: (settings: AccountSettings) => {
		window.localStorage.setItem(STORAGE_ACCOUNT_KEY, encrypt(JSON.stringify(settings)));
	},
	getCheckSettings: (): CheckSettings => {
		const settings = window.localStorage.getItem(STORAGE_CHECK_KEY);
		return settings ? JSON.parse(decrypt(settings)) : null;
	},
	setCheckSettings: (settings: CheckSettings) => {
		window.localStorage.setItem(STORAGE_CHECK_KEY, encrypt(JSON.stringify(settings)));
	},
};

export default settingsStorage;
