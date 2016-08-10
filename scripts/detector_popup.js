if (typeof browser === 'undefined' && typeof chrome !== 'undefined') browser = chrome;

var tab = null, gotList = false, d = document, bgPage, disablePreviews = false;

document.addEventListener('DOMContentLoaded', function() {
	browser.runtime.getBackgroundPage(function(bg) {
		bgPage = bg;
		browser.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
			tab = tabs[0];
			browser.tabs.sendMessage(tab.id, { action: 'get-rss-list' }, handleData);
		});
	});
});

function renderButton(data) {
	var tmp = d.createElement('div');
	tmp.dataset.url = data.url;
	tmp.addEventListener('click', disablePreviews ? sendToReader : generatePreview);
	tmp.className = 'button';
	tmp.innerHTML = tmp.title = data.title;
	d.body.appendChild(tmp);
}

function handleData(response){
	gotList = true;
	browser.storage.local.get('disablePreviews', function(data) {
		disablePreviews = data.disablePreviews;
		/*if (response.action == 'have-rss-list') */
		if (response && response.value) response.value.forEach(renderButton);
	});
}

function generatePreview(e) {
	bgPage.setPlainText(false);
	bgPage.loadRSS({ id: tab.id, url: e.target.dataset.url });
	window.close();
}

function sendToReader(e) {
	document.body.style.minWidth = document.body.offsetWidth + 'px';
	d.body.innerHTML = '<p>RSS Added<p>';
	bgPage.sendRequestToSmartRSS(e.target.dataset.url);
}
