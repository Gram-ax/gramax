import getLogo from "@components/HomePage/logos/getLogo";
import { getSrc } from "@components/HomePage/logos/utils";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type Theme from "@ext/Theme/Theme";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";
import fs from "fs";
import path from "path";
import { getAsstesLogo } from "../../../docportal/server/handlers/publicApi/homeLogo";

export default ApplyApiMiddleware(
	async function (req, res) {
		const basePath = this.app.conf.basePath.value ?? "";

		const query = req.query || {};
		const theme = (Array.isArray(query.theme) ? query.theme[0] : query.theme) as Theme;
		const isMobileQ = Array.isArray(query.isMobile) ? query.isMobile[0] : query.isMobile;
		const isMobile = isMobileQ === "true";

		const commands = this.commands;
		const assetsLogo = await getAsstesLogo(commands, theme);

		if (assetsLogo) {
			res.setHeader("Content-Type", assetsLogo.mimeType);
			res.send(assetsLogo.buffer);
			return;
		}

		const defaultLogoSrc = getSrc(getLogo(theme, isMobile));
		const logoPath =
			basePath && defaultLogoSrc.startsWith(basePath) ? defaultLogoSrc.slice(basePath.length) : defaultLogoSrc;

		const filePath = path.join(process.cwd(), logoPath.replace("_next", ".next"));
		const defaultLogo = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

		res.setHeader("Content-Type", MimeTypes.svg);
		res.send(defaultLogo);
	},
	[new MainMiddleware()],
);
