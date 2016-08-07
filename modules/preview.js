var xmldata;
var tmpDoc;
var settings;
var list;
var button;
var title;
var viewTpl;
var rssBaseURL;
var list;

document.addEventListener('DOMContentLoaded', init);

function init() {
	list = document.querySelector('#list');
	button = document.querySelector('#subscribe-button');
	viewTpl = document.querySelector('#template-preview').innerHTML;
	button.addEventListener('click', handleButtonClick);

	chrome.extension.sendMessage({ action: 'get-xml-content' }, handleMessage);
}

function handleMessage(message, sender, sendResponse) {
	if (message.action == 'xml-content') {
		xmldata = message.value;
		rssBaseURL = message.respURL;
		settings = message.settings;
		title = message.title;
		showRSS();
	} 
}

function showRSS() {	
	
	tmpDoc = document.createDocumentFragment(); //document.createElement('div');

	document.title = title;
	document.querySelector('h1').innerHTML = title;
	document.querySelector('h1').addEventListener('click', function() {
		window.top.postMessage({ action: 'no-preview'}, '*');
	});
	buildAll(xmldata);
	
   
}

function newElem(name, content, opt) {
	opt = opt || {};
	var el = document.createElement(name);
	var text = document.createTextNode(content);
	if (opt.id) el.id = opt.id;
	if (opt.className) el.className = opt.className;
	el.appendChild(text);
	return el;
}

function handleButtonClick() {
	var sel = document.querySelector('#subscribe select').value;

	if (sel == 'feedly') {
		window.open('http://cloud.feedly.com/#subscription/feed/' + encodeURIComponent(rssBaseURL));
	} else if (sel == 'theoldreader') {
		window.open('http://theoldreader.com/feeds/subscribe?url=' + encodeURIComponent(rssBaseURL))
	} else if (sel == 'inoreader') {
		window.open('http://www.inoreader.com/?add_feed=' + encodeURIComponent(rssBaseURL));
	} else {		
		chrome.runtime.sendMessage(settings.smartID, { action: 'new-rss', value: rssBaseURL });
	}
}

function buildAll(data) {	
	data.forEach(buildOne);
	document.body.appendChild(tmpDoc);
}

function template(tpl, data) {
	return tpl.replace(/\{\{(\w+)\}\}/gmi, function(all, q) {
		return data[q] || '';
	});
}

function buildOne(item) {
	var view = document.createElement('div');
	view.innerHTML = item.empty ? '' : template(viewTpl, item);
	view.className = 'list-item';
	list.appendChild(view);
}
