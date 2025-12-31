export type AuthorInfo = { name: string; email: string };

export default class AuthorInfoCodec {
	public static deserialize(data: string): AuthorInfo {
		if (!data) return;
		return {
			name: data.slice(0, data.indexOf("<")).trim(),
			email: data.slice(data.indexOf("<") + 1, data.lastIndexOf(">")).trim(),
		};
	}

	public static serialize(author: AuthorInfo): string {
		return `${author.name} <${author.email}>`;
	}
}
