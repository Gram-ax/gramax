window.navigateTo
	? window.navigateTo("/{url}")
	: console.warn("navigateTo is not defined; used window.location.replace instead") &&
	  window.location.replace("/{url}");
