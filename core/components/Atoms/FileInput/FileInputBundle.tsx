import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import Theme from "../../../extensions/Theme/Theme";
import ThemeService from "../../../extensions/Theme/components/ThemeService";
import { FileInputProps } from "./FileInputProps";

import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker() {
		return null;
	},
};

loader.config({ monaco });

loader.init();

const BundleFileInput = ({ value, language, onChange, height = "60vh" }: FileInputProps) => {
	const theme = ThemeService.value;
	return (
		<div style={{ padding: "1rem 0" }}>
			<Editor
				height={height}
				defaultLanguage={language}
				defaultValue={value}
				onChange={onChange}
				theme={theme == Theme.dark ? "vs-dark" : "light"}
			/>
		</div>
	);
};

export default BundleFileInput;
