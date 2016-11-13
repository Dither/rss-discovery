var xmldata, fragment, settings, list, subscribe, title, template, current_rss, select, list;

if (typeof browser === 'undefined' && typeof chrome !== 'undefined') browser = chrome;

document.addEventListener('DOMContentLoaded', init);

function init() {
	list = document.querySelector('#list');
	subscribe = document.querySelector('#subscribe-button');
	template = document.querySelector('template').innerHTML;
	select = document.querySelector('#subscribe select');
	subscribe.addEventListener('click', handleButtonClick);

	browser.runtime.sendMessage({ action: 'get-reader-list' }, handleMessage);
	browser.runtime.sendMessage({ action: 'get-xml-content' }, handleMessage);
}

function handleButtonClick() {
	if (select.value !== 'smartrss') window.open(select[select.selectedIndex].action + encodeURIComponent(current_rss));
	else if (typeof InstallTrigger !== 'undefined') window.open(current_rss)
	else browser.runtime.sendMessage(settings.smartID, { action: 'new-rss', value: current_rss });
}

function handleMessage(request, sender, sendResponse) {
	//console.log(request.action);
	if (request.action === 'xml-content') {
		xmldata = request.value;
		current_rss = request.respURL;
		settings = request.settings;
		title = request.title;
		showRSS();
	} else if (request.action === 'reader-list') {
		var data = request.readerList, i = null, option;
		for (i in data) {
			if (data.hasOwnProperty(i)) {
				option = document.createElement('option');
				option.value = i;
				option.action =  data[i].url;
				option.textContent = data[i].text;
				select.appendChild(option);
			}
		}
	}
}

function showRSS() {
	fragment = document.createDocumentFragment();
	document.title = title;
	document.querySelector('h1').innerHTML = title;
	document.querySelector('h1').addEventListener('click', function() {
		window.top.postMessage({ action: 'rss-no-preview'}, '*');
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

function buildAll(data) {
	data.forEach(buildOne);
	document.body.appendChild(fragment);
}

function parse_template(tpl, data) {
	return tpl.replace(/\{\{(\w+)\}\}/gmi, function(all, q) {
		return data[q] || '';
	});
}

function buildOne(item) {
	var view = document.createElement('div');
	view.innerHTML = item.empty ? '' : parse_template(template, item);
	view.className = 'list-item';
	list.appendChild(view);
}
