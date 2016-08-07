if (typeof browser === 'undefined') browser = chrome;

JSON.safeParse = function(str) {
	try { return JSON.parse(str); } catch(e) { return null; }
}

function start(fn) {
	document.body ? fn() : document.addEventListener('DOMContentLoaded', fn);
}

function $(q) {
	return Array.prototype.slice.call(document.querySelectorAll(q), 0);
}

browser.runtime.getBackgroundPage(function(bg) {

	start(function() {
		$('select[id]').forEach(function(item) {
			item.value = bg.settings.get(item.id);
			item.addEventListener('change', handleChange);
		});

		$('input[type=text]').forEach(function(item) {
			item.value = bg.settings.get(item.id);
			item.addEventListener('input', handleChange);
		});

		$('input[type=checkbox]').forEach(function(item) {
			item.checked = !!bg.settings.get(item.id);
			item.addEventListener('change', handleCheck);
		});

	});

	function handleChange(e) {
		var t = e.target;
		bg.settings.save(t.id, t.value);
	}

	function handleCheck(e) {
		var t = e.target;
		bg.settings.save(t.id, t.checked);
	}

});