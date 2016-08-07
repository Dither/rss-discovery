var d = document;
if (typeof browser === 'undefined') browser = chrome;

document.addEventListener('DOMContentLoaded', function() {

	browser.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
		var tab = tabs[0];
		browser.tabs.sendMessage(tab.id, { action: 'get-list' }, handleData);
	}); 

});

var disablePreviews = false;
function renderButton(data) {
	var tmp;
	if (disablePreviews) {
		tmp = d.createElement('div');
		tmp.dataset.url = data.url;
		tmp.addEventListener('click', handleNewRSS);		
	} else {
		tmp = d.createElement('a');
		tmp.href = data.url;
		tmp.target = '_blank';
		tmp.addEventListener('click', handleClick);
	}

	tmp.className = 'button';
	tmp.innerHTML = tmp.title = data.title;
	d.body.appendChild(tmp);
}

function handleData(message, sender, sendResponse){
	browser.storage.local.get('disablePreviews', function(data) {
		disablePreviews = data.disablePreviews;
		if (message.action == 'response-list') message.value.forEach(renderButton);
	});
}

function handleClick(e) {
	window.close();
}

function handleNewRSS(e) {
	document.body.style.minWidth = document.body.offsetWidth + 'px';
	d.body.innerHTML = '<p>RSS Added<p>';
	browser.storage.local.get('smartID', function(data) {
		id = data.smartID || 'nncgmpcdlilgbepbfpeidpjlcdfhmcfp';
		browser.runtime.sendMessage(id, { 
			action: 'new-rss', value: e.target.dataset.url 
		});
		//setTimeout(window.close, 1000);
	});
}