if (typeof browser === 'undefined') browser = chrome;

browser.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if (request.action == 'show-rss-icon') {
		var tab = sender.tab;
		browser.pageAction.setIcon({path: 'images/icon16_v2.png', tabId: tab.id});
		browser.pageAction.show(tab.id);
	} else if (request.action == 'get-xml-content') {
		sendResponse({ action: 'xml-content', value: resp, respURL: respURL, settings: settings._data, title: title });
	}
});

/**
 * Settings
 */
var settings = {
	_data: {},
	get: function(s) {
		return this._data[s];
	},
	save: function(s, v) {
		this._data[s] = v;
		browser.storage.local.set(this._data);
	},
	set: function(s, v) {
		this._data[s] = v;
	}
};

browser.storage.local.get({
	'smartID': 'nncgmpcdlilgbepbfpeidpjlcdfhmcfp',
	'disablePreviews': false,
	'hoursFormat': '24h',
	'dateType': 'normal',
    'otherReaders': '{}'
}, function(data) {
	for (i in data) {
		settings.set(i, data[i]);
	}
});

/**
 * RSS Preiews
 */
function getContentType(arr) {
	for (var i=0; i<arr.length; i++) {
		if (arr[i].name.toLowerCase() == 'content-type') {
			var arr = arr[i].value.split(';');
			return {
				mime: arr[0],
				charset: (arr.length > 1 ? arr[1] : null)
			};
		}
	}
	return '';
}

var rssMimes = ['application/rss', 'application/rss+xml', 'application/atom+xml', 'application/atom', 'text/atom', 'text/atom+xml'];
var xmlMimes = ['text/xml', 'application/xml'];
var urlParts = /(new|feed|rss)/i;

browser.webRequest.onHeadersReceived.addListener(handleHeaders,
	{
		urls: ['https://*/*', 'http://*/*'],
		types: ['main_frame']
	},
	['responseHeaders', 'blocking']
);

function handleHeaders(details) {
    if (settings.get('disablePreviews')) return;

	var contentType = getContentType(details.responseHeaders);
	if (~rssMimes.indexOf(contentType.mime)) {
		loadRSS({ id: details.tabId, url: details.url });

	} else if (~xmlMimes.indexOf(contentType.mime) && urlParts.test(details.url)) {
		loadRSS({ id: details.tabId, url: details.url });

        details.responseHeaders.push({
            name: 'Content-Type',
            value: 'application/rss+xml' + (contentType.charset ? '; ' + contentType.charset : '')
        });

		return { responseHeaders: details.responseHeaders };
	}
}

function loadRSS(tab) {
	var retries = 0, xhr = new XMLHttpRequest();
	respURL = tab.url;
	xhr.open('get', respURL, true);
	xhr.responseType = 'text';
	var onStateChange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE) {
        	if (xhr.status === 200) handleRSSLoaded(tab, xhr.response);
            else if (xhr.status > 500 && ++retries < 3) setTimeout(function(){
            	xhr.open('get', respURL, true);
            	xhr.send();
            }, 1000);
        }
    };
    xhr.onreadystatechange = onStateChange;
	xhr.send();

}

var resp, respURL, title;
function handleRSSLoaded(tab, response) {
	var parser = new DOMParser(),
		xmlDoc = parser.parseFromString(response, 'application/xml'),
		data = parseRSS(xmlDoc);

	if (data && data.length > 10) {
		resp = data;
		injection(tab, 1);
	}
}

function injection(tab, i) {
	i = Number(i) || 1;

	if (i < 10) {
		var to = setTimeout(function() {
			injection(tab, ++i);
		}, 300);
	}

	browser.tabs.executeScript(tab.id, { file: '/modules/create_iframe.js' }, function() {
		clearTimeout(to);
	});
}

/**
 * RSS Parser ... I should make it modular as I use it in both extensions
 */
function parseRSS(xml) {
 	var items = [];

 	var nodes = xml.querySelectorAll('item');
 	if (!nodes.length) nodes = xml.querySelectorAll('entry');
 	title = getFeedTitle(xml);

 	var dateFormats = { normal: 'DD.MM.YYYY', iso: 'YYYY-MM-DD', us: 'MM/DD/YYYY' };


 	[].forEach.call(nodes, function(node) {
 		items.push({
 			title: rssGetTitle(node),
 			url: rssGetLink(node),
 			date: rssGetDate(node),
 			author: rssGetAuthor(node, title),
 			content: rssGetContent(node),
 		});

 		var last = items[items.length - 1];
 		if (last.date == '0') last.date = Date.now();
 		last.content = removeHtml(last.content);
 		last.author = removeHtml(last.author);
 		last.title = removeHtml(last.title);

 		var pickedFormat = dateFormats[settings.get('dateType')] || dateFormats['normal'];
 		var timeFormat = settings.get('hoursFormat') == '12h' ? 'H:mm a' : 'hh:mm';
 		last.date = formatDate(last.date, pickedFormat + ' ' + timeFormat);
 	});


 	items.push({ empty: true });
 	items.push({ empty: true });
 	items.push({ empty: true });
 	items.push({ empty: true });
 	items.push({ empty: true });
 	items.push({ empty: true });

 	return items;
}


function removeHtml(str) {
	return str.replace(/</gmi, '<!--').replace(/>/gmi, '--> ');
}

function rssGetLink(node) {
	if (!node) return null;

	var link = node.querySelector('link[rel="alternate"]');
	if (!link) link = node.querySelector('link[type="text/html"]');
	if (!link) link = node.querySelector('link');
	if (link) return link.textContent || link.getAttribute('href');

	return null;
}

function getFeedTitle(xml) {
	var title = xml.querySelector('channel > title, feed > title, rss > title');
	if (!title || !(title.textContent).trim())
        title = xml.querySelector('channel > description, feed > description, rss > description');

	if (!title || !(title.textContent).trim())
		title = xml.querySelector('channel > description, feed > description, rss > description');

	if (!title || !(title.textContent).trim())
		title = xml.querySelector('channel > link, feed > link, rss > link');

	return title && title.textContent ? title.textContent.trim() || 'rss' : 'rss';
}

function replaceUTCAbbr(str) {
	str = String(str);
	var rep = {
		'CET': '+0100', 'CEST': '+0200', 'EST': '', 'WET': '+0000', 'WEZ': '+0000', 'WEST': '+0100',
		'EEST': '+0300', 'BST': '+0100', 'EET': '+0200', 'IST': '+0100', 'KUYT': '+0400', 'MSD': '+0400',
		'MSK': '+0400', 'SAMT': '+0400'
	};
	var reg = new RegExp('(' + Object.keys(rep).join('|') + ')', 'gi');
	return str.replace(reg, function(all, abbr) {
		return rep[abbr];
	});
}

function rssGetDate(node) {
	var pubDate = node.querySelector('pubDate, published');
	if (pubDate)
		return (new Date( replaceUTCAbbr(pubDate.textContent) )).getTime();

	if (pubDate = node.querySelector('date'))
		return (new Date( replaceUTCAbbr(pubDate.textContent) )).getTime();

	if (pubDate = node.querySelector('lastBuildDate, updated, update'))
		return (new Date( replaceUTCAbbr(pubDate.textContent) )).getTime();

	return '0';
}

function rssGetAuthor(node, title) {
	var creator = node.querySelector('creator, author > name');
	if (creator) creator = creator.textContent.trim();
	else {
       if (creator = node.querySelector('author')) creator = creator.textContent.trim();
	   else if (title && title.length > 1) creator = title.trim();
    }

	if (creator && creator.length) {
		if (/^\S+@\S+\.\S+\s+\(.+\)$/.test(creator)) creator = creator.replace(/^\S+@\S+\.\S+\s+\((.+)\)$/, '$1');
		creator = creator.replace(/\s*\(\)\s*$/, '');
		return creator;
	}

	return 'no author';
}

function rssGetTitle(node) {
	return node.querySelector('title') ? node.querySelector('title').textContent : '<no title>;';
}

function rssGetContent(node) {
	var desc = node.querySelector('encoded');
	if (desc) return desc.textContent;
	if (desc = node.querySelector('description')) return desc.textContent;
	if (desc = node.querySelector('summary')) return desc.textContent;
	if (desc = node.querySelector('content')) return desc.textContent;

	return '&nbsp;';
}

/**
 * Date parser
 */

var formatDate = function() {
	var that;
	var addZero = function(num) {
		if (num < 10) num = "0" + num;
		return num;
	};
	var na = function(n, z) {
		return n % z;
	};
	var dateVal = function(all, found) {
		switch (found) {
			case "DD":
				return addZero(that.getDate());
			case "D":
				return that.getDate();
			case "MM":
				return addZero(that.getMonth() + 1);
			case "M":
				return that.getMonth() + 1;
			case "YYYY":
				return that.getFullYear();
			case "YY":
				return that.getFullYear().toString().substr(2, 2);
			case "hh":
				return addZero(that.getHours());
			case "h":
				return that.getHours();
			case "HH":
				return addZero(na(that.getHours(), 12));
			case "H":
				return na(that.getHours(), 12);
			case "mm":
				return addZero(that.getMinutes());
			case "m":
				return that.getMinutes();
			case "ss":
				return addZero(that.getSeconds());
			case "s":
				return that.getSeconds();
			case "u":
				return that.getMilliseconds();
			case "U":
				return that.getTime();
			case "T":
				return that.getTime() - that.getTimezoneOffset() * 60000;
			case "W":
				return that.getDay();
			case "a":
				return that.getHours() > 12 ? "PM" : "AM";
			default:
				return "";
		}
	};
	return function(date, str) {
		date = new Date(date);
		that = date;
		str = str.replace(/(DD|D|MM|M|YYYY|YY|hh|h|HH|H|mm|m|ss|s|u|U|W|a|T)/g, dateVal);
		return str;
	};
}();
