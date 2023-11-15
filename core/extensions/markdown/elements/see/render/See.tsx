import React, { useEffect, useState } from "react";

const See = ({ link, name, lang }: { link: string; name: string; lang?: string }) => {
	const [showNmae, setShowName] = useState(name ? name.replace(/[^a-zA-ZА-Яа-яЁё ]/gi, "") : null);

	const idLink = link[0] == "#" ? link.slice(1) : null;

	useEffect(() => {
		if (!idLink || showNmae) return;
		const elem = document.getElementById(idLink);
		if (elem) setShowName(elem.innerText);
	});

	if (!showNmae) return null;
	return (
		<span data-type="see" data-value={link}>
			{lang == "en" ? "See " : "См. "} <a href={link}>{showNmae}</a>
		</span>
	);
};

export default See;
