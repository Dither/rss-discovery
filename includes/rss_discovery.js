// DOMContentLoaded

if (document instanceof HTMLDocument) {

    if (typeof browser === 'undefined') browser = chrome;

    var interval = setInterval(function() {
        if (!document.querySelector('body')) return;
        clearInterval(interval);
        detect();
    }, 200);

    document.addEventListener('DOMContentLoaded', function() {
        clearInterval(interval);
        detect();
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

    function detect() {
        var rssData = [].map.call(document.querySelectorAll('link[type^="application/rss"], link[type^="application/atom"]'), function(feed) {
            return { url: feed.href, title: feed.title || feed.href };
        });

        if (rssData.length > 0)  {
            browser.runtime.sendMessage({ action: 'show-rss-icon' }, function() {});
            browser.runtime.onMessage.addListener(function(message, sender, sendResponse){
                if (message.action && message.action === 'get-list') sendResponse({ action: 'response-list', value: rssData });
            });
        }
    }
}
