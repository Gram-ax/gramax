import Editor from "@monaco-editor/react";
import Theme from "../../../extensions/Theme/Theme";
import ThemeService from "../../../extensions/Theme/components/ThemeService";

export const FileInput = ({
	value,
	language,
	onChange,
	height = "60vh",
}: {
	value: string;
	onChange: (value: string) => void;
	language: string;
	height?: string;
}) => {
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
