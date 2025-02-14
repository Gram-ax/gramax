const generateUnsupportedMd = (source: string, url: string, type: string, stack: string, json: string): string => {
	return `[unsupported:${source}:${url}:${type}]\n\`\`\`JSON\n${stack}
	${json ? `\n\n\n${json}` : ""}\n\`\`\`\n[/unsupported]`;
};

export default generateUnsupportedMd;
