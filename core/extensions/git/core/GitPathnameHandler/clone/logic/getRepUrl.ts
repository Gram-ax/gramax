import ShareData from "@ext/catalog/actions/share/model/ShareData";
import GitShareData from "@ext/git/core/model/GitShareData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const getRepUrl = (shareData: ShareData): { href: string; value: string } => {
	if (shareData.sourceType === SourceType.gitHub) {
		const { domain, group, name, branch } = shareData as GitShareData;
		const link = `${domain}/${group}/${name}${branch ? `/tree/${branch}` : ""}`;
		return { href: `https://${link}`, value: link };
	}

	if (shareData.sourceType === SourceType.gitLab) {
		const { domain, group, name, branch, protocol } = shareData as GitShareData;
		const link = `${domain}/${group}/${name}${branch ? `/-/tree/${branch}` : ""}`;
		return { href: `${protocol ?? "https"}://${link}`, value: link };
	}

	if (shareData.sourceType === SourceType.gitVerse) {
		const { domain, group, name, branch } = shareData as GitShareData;
		const link = `${domain}/${group}/${name}${branch ? `/content/${branch}` : ""}`;
		return { href: `https://${link}`, value: link };
	}

	if (shareData.sourceType === SourceType.git) {
		const { domain, group, name, protocol } = shareData as GitShareData;
		const link = `${domain}/${group}/${name}`;
		return { href: `${protocol ?? "https"}://${link}`, value: link };
	}

	// What to do with enterprise?

	return { href: "", value: "" };
};

export default getRepUrl;
