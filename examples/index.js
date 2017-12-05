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

  var url = 'https://api.github.com';
  var output = document.getElementById('output');

  function send() {
    console.time('Fetched');

    var result = fetch(url);

    result
      .then(function(response) {
        console.log('Header: ', response.headers.get('Content-Type'));

        var json = response.json();

        console.log('Response: ', response);

        return json;
      })
      .then(function(json) {
        console.log('Got json: ', json);
        console.timeEnd('Fetched');

        output.innerText = new Date().toISOString() + ': ' + url + '\n\n' + JSON.stringify(json, null, 2);
      })
      ['catch'](function(error) {
        console.error('Failed: ', error);
        console.timeEnd('Fetched');
      });
  }

  document.getElementById('fetch').onclick = send;
})();
