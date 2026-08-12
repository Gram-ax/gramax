// Instagram post/reel/tv links embed via the `/embed` endpoint, e.g.
// https://www.instagram.com/reel/CODE/ -> https://www.instagram.com/reel/CODE/embed
// Reels may also live under a profile (instagram.com/<user>/reel/CODE) and carry
// tracking query params (?igsh=...); both are handled here.
const getInstagramEmbedUrl = (url: string): string => {
	const match = url.match(/instagram\.com\/(?:[^/?#]+\/)?(p|reel|reels|tv)\/([^/?#]+)/);
	if (!match) return url;

	const type = match[1] === "reels" ? "reel" : match[1];
	return `https://www.instagram.com/${type}/${match[2]}/embed`;
};

export default getInstagramEmbedUrl;
