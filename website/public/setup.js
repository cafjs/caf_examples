function loadApp(loc, appName, link, username, token) {
    var search = '';
    if (username) {
        search = '?username=' + encodeURIComponent(username);
    }
    if (token) {
        search = (search === '' ? '?' : (search + '&'));
        search = search + 'token=' + encodeURIComponent(token);
    }
    link.href = loc.protocol + '//' + loc.host.replace('website', appName) +
        '/app.html' + search;
    return true;
}
