/**
 * This file is inserted into all rss or xml files by bg process.
 * It repaces the xml content with large iframe.
 */


var noPreview = sessionStorage.getItem('no-preview') || 'off';

if (document instanceof HTMLDocument && noPreview == 'off') {
	/**
	 * This get rids of the XML text, however I'm not sure If it will work every time :(
	 */
	document.documentElement.innerHTML = '<head><style>body > * { display: none; }</style></head><body></body>';
	

	var iframe;

	function init() {
		document.documentElement.style.cssText = 'width: 100%; height: 100%; margin: 0;';
		document.body.style.cssText = 'margin: 0; width: 100%; height: 100%;';
		iframe = document.createElement('iframe');
		iframe.src = chrome.extension.getURL('rss.html');
		iframe.style.cssText = 'border: none; margin: 0; width: 100%; height: 100%; display: block !important;';
		document.body.appendChild(iframe);
	}

	if (document.readyState == "complete") {
		init();
	} else {
		document.addEventListener('DOMContentLoaded', init);
	}

	window.addEventListener('message', function(e) {
		if (e.data) {
			if (e.data.action == 'no-preview') {
				sessionStorage.setItem('no-preview', 'on');
				location.reload();
			} 
		}
	});
} else if (noPreview) {
	sessionStorage.setItem('no-preview', 'off');
}