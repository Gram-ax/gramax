import os from "os";
import { mkdtempSync } from "fs";
import { basename, join } from "path";
import buildCommandFunction from "../../build";
import ChalkLogger from "../../../../utils/ChalkLogger";
import CliUserError from "../../../CliUserError";
import detectPackageManager from "./detectPackageManager";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import askQuestion from "../../utils/askQuestion";
import { logStep } from "../../utils/logger";
import { HELPER_PKG, packageManagers, RunGramaxExportPdfProps } from "./exportConfig";
import { spawnSync } from "child_process";
import runGramaxExportPdf from "./runGramaxExportPdf";
import { checkExistsPath } from "../../utils/paths";

const installPakage = async (skipConfirm: boolean) => {
	const pm = detectPackageManager();
	const installCmd = packageManagers[pm] || packageManagers.npm;

	const confirmPackageInstallation = async () => {
		ChalkLogger.log(`Install globally with:`);
		ChalkLogger.log(installCmd, { indent: 1 });
		if (skipConfirm) return;

		const answer = await askQuestion("Install now? (Y/n): ");

		if (answer && answer.toLowerCase() !== "y") {
			ChalkLogger.log();
			process.exit(0);
		}
	};
	await confirmPackageInstallation();

	const install = spawnSync(installCmd, { stdio: "inherit", shell: true });
	if (install.status !== 0) {
		throw new CliUserError(`Failed to install '${HELPER_PKG}' globally`);
	}
};

const pingPakage = () => {
	const child = spawnSync(HELPER_PKG, ["ping"], {
		stdio: ["pipe", "pipe", "pipe"],
		shell: true,
	});
	return child.status === 0;
};

export const runPdfCli = async (props: RunGramaxExportPdfProps & { skipConfirm: boolean }) => {
	const { source, skipConfirm, ...rest } = props;

	const templatePath = rest.params.template;
	if (templatePath) await checkExistsPath(templatePath);

	const tmpBase = os.tmpdir();
	const outputDir = mkdtempSync(join(tmpBase, "gramax-export-"));

	await logStep(
		"Building static site for PDF export",
		() =>
			buildCommandFunction({
				source,
				destination: outputDir,
				SkipCheck: true,
				customCss: null,
				docxTemplates: null,
				forceUiLangSync: false,
				features: "export-pdf",
				BaseUrl: "",
				pdfTemplates: templatePath,
			}),
		{ silent: true },
	);

	const tryResolveAndRun = async () => {
		try {
			if (templatePath) rest.params.template = basename(templatePath);

			return await runGramaxExportPdf({ source: outputDir, ...rest });
		} catch (e) {
			if (e instanceof DefaultError) {
				throw new DefaultError(`Error in module '${HELPER_PKG}': ${e.message}`);
			} else throw e;
		}
	};

	if (!pingPakage()) {
		ChalkLogger.log();
		ChalkLogger.warn(`Module '${HELPER_PKG}' not found or not installed`);
		await installPakage(skipConfirm);
	}

	await tryResolveAndRun();
};

export default runPdfCli;
