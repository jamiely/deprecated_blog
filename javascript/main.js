(function () {
  var codeStyle = null;

  // https://stackoverflow.com/questions/1038727/how-to-get-browser-width-using-javascript-code
  function getWidth() {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
  }

  // lock the height so that when we adjust the width, the box doesn't collapse
  // to a smaller height. if it does, there will be weird jitter when hovering
  // at the bottom of the box.
  function lockHeight(el) {
    el.style.height = el.offsetHeight + 'px';
  }

  // we unlock the height at a certain point so that when the window is resized,
  // we can get the new height of the element.
  function unlockHeight(el) {
    el.style.height = null;
  }

  function prepareCodeStyle() {
    var codeClass = 'div.highlighter-rouge';
    var className = 'expandCode';
    var exampleCodeElement = document.querySelector(codeClass);
    if(! exampleCodeElement) return console.log('No code elements present');

    // remove all the classes
    document.querySelectorAll(codeClass).forEach(function(el) {
      el.classList.remove(className);
      unlockHeight(el);
    })

    var padding = 50;
    var left = - ( getOffset(exampleCodeElement).left - padding);
    console.log(left);
    var width = getWidth() - 2 * padding;
    if(width <= exampleCodeElement.offsetWidth) {
      return console.log('the element width is greater than the page width');
    }

    if(! codeStyle) {
      codeStyle = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(codeStyle);
    }

    document.querySelectorAll(codeClass).forEach(function(el) {
      el.classList.add(className);
      lockHeight(el);
    })

    codeStyle.type = 'text/css';
    var parts = [
      'left:' + left + 'px; ',
      'position: relative; ',
      'width: ' + width + 'px; ',
      'transition: all 0.3s;',
      'transition-timing-function: cubic-bezier(.16,-0.06,.41,1.1);'
    ]
    codeStyle.innerHTML = [
      '.' + className + ' { transition-timing-function: ease-out; transition: all 1s; position: relative; left: 0px; width: ' +
        exampleCodeElement.offsetWidth + 'px; }',
      '.' + className + ':hover { ' + parts.join(' ') + ' }',
      '.' + className + ' pre.highlight { height: 100%; }'
    ].join('\n');
  }

  function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
  }

  function prepare() {
    console.log('prepare');
    prepareCodeStyle();
  }

  function onMouseOver(evt) {
    var div = evt.target.closest('.highlighter-rouge');
    if(! div) return;
    console.log(div);

    var offset = getOffset(div);
    
  }

  function ready() {
    if(! document) return;
    window.addEventListener('resize', function() {
      console.log('resize');
      prepareCodeStyle();
    });
    document.addEventListener('DOMContentLoaded', function() {
      try {
        prepare();
      }
      catch(e) {
        console.log(e);
      }
    });
  }

  ready();
})();