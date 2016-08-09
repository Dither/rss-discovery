// DOMContentLoaded
if (document instanceof HTMLDocument) {
    if (typeof browser === 'undefined') browser = chrome;

    var rssData = [], noPreview = sessionStorage.getItem('no-preview') || 'off',
        interval = setInterval(function() {
            // fast failsafe detection
            if (!document.querySelector('body')) return;
            clearInterval(interval);
            detect();
        }, 200);

    document.addEventListener('DOMContentLoaded', function() {
        clearInterval(interval);
        // standard detection
        detect();
        // observer in case of dynamically added RSS feeds
        var head = document.querySelector('head');
        if (head && typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(m) {
                if (m.target.localName !== "LINK") return;
                var type = m.target.getAttribute('type');
                if (type && (~type.indexOf('xml') || ~type.indexOf('rss') || ~type.indexOf('atom')))
                    detect();
              });
            });
            observer.observe(head, { childList: true });
        }
    });

    var detect = function () {
        rssData = [].map.call(document.querySelectorAll('link[type^="application/rss"], link[type^="application/atom"]'), function(feed) {
            return { url: feed.href, title: feed.title || feed.href };
        });
        if (rssData.length > 0) browser.runtime.sendMessage({ action: 'show-rss-icon' });
    };

    var init_frame = function() {
        window.stop();
        var html = document.getElementsByTagName('html')[0];
        while (html && html.attributes && html.attributes.length > 0) { // measure against on.. attributes
            html.removeAttributeNode(html.attributes[0]);
        }
        document.documentElement.innerHTML = '<html><head><style>body>*{display: none;}</style></head><body></body></html>';
        document.documentElement.style.cssText = 'width: 100%; height: 100%; margin: 0;';
        document.body.style.cssText = 'margin: 0; width: 100%; height: 100%;';
        var iframe = document.createElement('iframe');
        iframe.src = chrome.extension.getURL('preview_frame.html');
        iframe.style.cssText = 'border: none; margin: 0; width: 100%; height: 100%; display: block !important;';
        document.body.appendChild(iframe);

        window.addEventListener('message', function(e) {
            if (e.data && e.data.action == 'rss-no-preview') location.reload();
        });
    };

    browser.runtime.onMessage.addListener(function(request, sender, sendResponse){
        //console.log(request.action);
        if (!request.action) return;
        switch (request.action) {
            case 'get-rss-list':
                sendResponse({ action: 'have-rss-list', value: rssData });
                break;
            case 'get-xml-content':
                sendResponse({ action: 'have-xml-content', value: document.documentElement.textContent });
                break;
            case 'show-preview-frame':
                init_frame();
                break;
            default:
        }
    });
}
