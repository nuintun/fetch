(function() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }

    return number;
  }

  if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
      return (
        this.getUTCFullYear() +
        '-' +
        pad(this.getUTCMonth() + 1) +
        '-' +
        pad(this.getUTCDate()) +
        'T' +
        pad(this.getUTCHours()) +
        ':' +
        pad(this.getUTCMinutes()) +
        ':' +
        pad(this.getUTCSeconds()) +
        '.' +
        (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z'
      );
    };
  }

  var index = 1;
  var locked = false;
  var output = document.getElementById('output');

  function send() {
    if (locked) {
      return console.warn('Already have a fetch, please wait for the previous completion.');
    }

    locked = true;

    var bookmark = 'Fetch-' + index++;
    var url = 'https://httpbin.org/get?fetch=true&timestamp=' + +new Date();

    console.time(bookmark);

    var result = fetch(url);

    output.innerText = '⚡ Loading...';

    result
      .then(function(response) {
        console.log('Header:', response.headers.get('Content-Type'));

        var json = response.json();

        console.log('Response:', response);

        return json;
      })
      .then(function(json) {
        console.log('Got json:', json);

        output.innerText =
          '🌏 URL: ' +
          url +
          '\n' +
          '🕗 Time: ' +
          new Date().toISOString() +
          '\n' +
          '🔊 Response: ' +
          JSON.stringify(json, null, 2);
      })
      ['catch'](function(error) {
        output.innerText = '💔 Fetch error: ' + error.message;

        console.error('Failed:', error);
      })
      ['finally'](function() {
        locked = false;

        console.timeEnd(bookmark);
      });
  }

  document.getElementById('fetch').onclick = send;
})();
