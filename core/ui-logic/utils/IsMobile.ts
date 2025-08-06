// Source from https://github.com/juliangruber/is-mobile

const mobileRE =
	/(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|redmi|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
const notMobileRE = /CrOS/;

const tabletRE = /android|ipad|playbook|silk/i;

interface HttpRequestHeadersInterfaceMock {
	[id: string]: string | string[] | undefined;
}

interface HttpRequestInterfaceMock {
	headers: HttpRequestHeadersInterfaceMock;

	[id: string]: any;
}

interface IsMobileOptions {
	ua?: string | HttpRequestInterfaceMock;
	tablet?: boolean;
	featureDetect?: boolean;
}

const isMobile = (opts: IsMobileOptions = {}) => {
	let ua = opts.ua;
	if (!ua && typeof navigator !== "undefined") ua = navigator.userAgent;
	if (ua && typeof ua === "object" && typeof ua.headers === "object" && typeof ua.headers["user-agent"] === "string")
		ua = ua.headers["user-agent"];

	if (typeof ua !== "string") return false;

	let result = (mobileRE.test(ua) && !notMobileRE.test(ua)) || (!!opts.tablet && tabletRE.test(ua));

	if (
		!result &&
		opts.tablet &&
		opts.featureDetect &&
		navigator &&
		navigator.maxTouchPoints > 1 &&
		ua.indexOf("Macintosh") !== -1 &&
		ua.indexOf("Safari") !== -1
	) {
		result = true;
	}

	return result;
};

export default isMobile;
