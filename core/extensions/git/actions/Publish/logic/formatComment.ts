import SideBarData from "@ext/git/actions/Publish/model/SideBarData";

const formatPath = ({ path, oldPath }: { path?: string; oldPath?: string }) => {
	if (path && oldPath && path != oldPath) return `${oldPath} -> ${path}`;
	return path ?? oldPath;
};

const getAllFilePaths = (data: SideBarData[]) => {
	const res: { path: string; prefix: string }[] = [];
	data.filter((x) => x).forEach(({ data }) => {
		if (!data.isChecked) return;
		res.push({ path: formatPath(data.filePath), prefix: " - " });
		data.resources.forEach((resource) => res.push({ path: formatPath(resource.data.filePath), prefix: "   - " }));
	});
	return res.filter((x) => x);
};

const formatComment = (data: SideBarData[]) => {
	if (!data) return "";
	const paths = getAllFilePaths(data);
	if (paths.length == 1) return `Update file: ${paths[0].path}`;
	return `Update ${paths.length} files\n\n${paths.map((d) => `${d.prefix}${d.path}`).join("\n")}`;
};

export default formatComment;
