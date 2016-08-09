if (typeof browser === 'undefined') browser = chrome;

function start(fn) {
	document.body ? fn() : document.addEventListener('DOMContentLoaded', fn);
}

function find(q) {
	return Array.prototype.slice.call(document.querySelectorAll(q), 0);
}

function query(q, e) {
	if (!e) e = document;
	return e.querySelector(q);
}

browser.runtime.getBackgroundPage(function(bg) {
	var onchange = function(e) {
		var t = e.target;
		bg.settings.save(t.id, t.checked || t.value);
	}

	start(function() {
		find('select[id]:not(.readers), input[type=text]:not(.readers),input[type=checkbox]:not(.readers)').forEach(function(item) {
			item.value = bg.settings.get(item.id);
			item.addEventListener('change', onchange);
		});

		var readerList = query('#reader-list');
		var updateRow = function (id, name, url) {
			var row = query('tr.' + id)
			query('.name', row).textContent = name;
			query('.url', row).textContent = url;
		}
		var createRow = function (id, name, url) {
			var tr = document.createElement('tr');
			tr.className = id;
			var td = document.createElement('td');
			td.className = 'name';
			td.textContent = name;
			tr.appendChild(td);
			td = document.createElement('td');
			td.className = 'url';
			td.textContent = url;
			tr.appendChild(td);
			td = document.createElement('td');
			var button =  document.createElement('button');
			button.className = 'edit-item-btn';
			button.textContent = 'Edit';
			button.onclick = function(){
				var i_name = query('#name-field'),
					i_id = query('#id-field'),
					i_url = query('#url-field');

				i_name.value = query('.name', this.parentElement.parentElement).textContent;
				i_id.value = this.parentElement.parentElement.className;
				i_url.value = query('.url', this.parentElement.parentElement).textContent;
				edit.style.display = 'inherit';
				add.style.display = 'none';
			}
			td.appendChild(button);
			button =  document.createElement('button');
			button.className = 'remove-item-btn';
			button.textContent = 'Remove';
			button.onclick = function(){
				if (!confirm('Are you sure?')) return;
				delete readerListLoc[this.parentElement.parentElement.className];
				bg.settings.save('readerList', readerListLoc);
				this.parentElement.parentElement.parentElement.removeChild(this.parentElement.parentElement);
			}
			td.appendChild(button);
			tr.appendChild(td);
			readerList.insertBefore(tr, readerList.childNodes[0]);
		};

		var readerListLoc = bg.settings.get('readerList'),
			add = query('#add-btn'),
			edit = query('#edit-btn'),
			id = query('#id-field'),
			name = query('#name-field'),
			url = query('#url-field');
		edit.style.display = 'none';

		add.onclick = function (arguments) {
			if (!name.value || !url.value) return;
			if (!id.value)
				id.value = name.value.replace(/^\d+|[^\w\d]/ig, '').toLowerCase() || 'id'+parseInt(Date.now(), 10);

			readerListLoc[id.value] = {url: url.value, text: name.value};
			bg.settings.save('readerList', readerListLoc);
			createRow(id.value, name.value, url.value);

			id.value = name.value = url.value = '';
		};

		edit.onclick = function (arguments) {
			if (!name.value || !url.value) return;
			edit.style.display = 'none';
			add.style.display = 'inherit';

			readerListLoc[id.value] = {url: url.value, text: name.value};
			bg.settings.save('readerList', readerListLoc);
			updateRow(id.value, name.value, url.value);

			id.value = name.value = url.value = '';
		};

		var i = null, option;
		for (i in readerListLoc)
			if (readerListLoc.hasOwnProperty(i))
				createRow(i, readerListLoc[i].text, readerListLoc[i].url);


	});
});
