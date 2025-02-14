import { GetSpacesOptions } from "@ext/confluence/core/api/model/ConfluenceAPI";

const buildCqlQuery = (options: GetSpacesOptions) => {
	const { type, title, spaceKey, orderBy, sortDirection = "desc" } = options;

	const cqlParts = [];
	if (type) cqlParts.push(`type="${type}"`);
	if (title) cqlParts.push(`title~"${title}*"`);
	if (spaceKey) cqlParts.push(`space="${spaceKey}"`);

	let cql = cqlParts.join(" AND ");

	if (orderBy) {
		cql += ` ORDER BY ${orderBy} ${sortDirection}`;
	}

	return encodeURIComponent(cql);
};

export default buildCqlQuery;
