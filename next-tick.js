var queue = [];
var image = new Image();

image.onerror = function() {
  var fn;

  while ((fn = queue.shift())) {
    fn();
  }
};

function nextTick(fn) {
  queue.push(fn);

  image.src = '';
}

setTimeout(function() {
  console.log('1');
});

nextTick(function() {
  console.log('2');

  nextTick(function() {
    console.log('3');
  });
});

nextTick(function() {
  console.log('4');

  nextTick(function() {
    console.log('5');
  });
});

console.log('6');
