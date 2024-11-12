export default (blobUrl) => {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", blobUrl);
		xhr.responseType = "blob";
		xhr.onload = () => {
			if (xhr.status === 200) {
				const blob = xhr.response;
				const reader = new FileReader();
				reader.onloadend = () => {
					resolve(reader.result);
				};
				reader.readAsArrayBuffer(blob);
			} else reject();
		};
		xhr.send();
	});
};
