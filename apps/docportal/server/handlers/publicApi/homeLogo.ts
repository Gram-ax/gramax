import type { CommandTree } from "@app/commands";
import getLogo from "@components/HomePage/logos/getLogo";
import { getSrc } from "@components/HomePage/logos/utils";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Theme from "@ext/Theme/Theme";
import fs from "fs";
import path from "path";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import { headers } from "./headers";

const homeLogo = async (req: DocportalApiRequest, commands: CommandTree) => {
	const query = req.query || {};
	const theme = (Array.isArray(query.theme) ? query.theme[0] : query.theme) as Theme;
	const isMobileQ = Array.isArray(query.isMobile) ? query.isMobile[0] : query.isMobile;
	const isMobile = isMobileQ === "true";

	const assetsLogo = await getAsstesLogo(commands, theme);

	if (assetsLogo) {
		return new Response(assetsLogo.buffer, {
			status: 200,
			headers: { ...headers.base, ...headers.contentType(assetsLogo.mimeType) },
		});
	}

	const defaultLogoSrc = getSrc(getLogo(theme, isMobile));

	const filePath = path.join(process.cwd(), "dist", defaultLogoSrc);
	const defaultLogo = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

	return new Response(defaultLogo, {
		status: 200,
		headers: { ...headers.base, ...headers.contentType(MimeTypes.svg) },
	});
};

export const getAsstesLogo = async (commands: CommandTree, theme: Theme) => {
	const getAsstesLogo = commands.workspace.assets.homeIconActions.getLogo;
	let assetsLogo: string;

	if (theme === Theme.dark) {
		const args = getAsstesLogo.params(undefined, { theme }, undefined);
		assetsLogo = await getAsstesLogo.do(args);
	}

	if (!assetsLogo) {
		const args = getAsstesLogo.params(undefined, { theme: Theme.light }, undefined);
		assetsLogo = await getAsstesLogo.do(args);
	}

	if (!assetsLogo) return;

	const base64Data = await getBase64Data(assetsLogo);
	return base64Data;
};

const getBase64Data = async (assetsLogo: string) => {
	const matches = assetsLogo.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
	if (!matches) return;

	const mimeType = matches[1] as MimeTypes;
	const base64Data = matches[2];

	const buffer = Buffer.from(base64Data, "base64");
	return { mimeType, buffer };
};

export default homeLogo;
