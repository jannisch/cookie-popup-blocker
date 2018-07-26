function isFixed(node) {
  return window.getComputedStyle(node).position === 'fixed'
}

function isCookieNotice(node) {
  const attrs = [
    node.id,
    node.className,
    node.getAttribute('aria-label')
  ]
  return attrs.some(attr => /(cookie|gdpr|consent)/i.test(attr))
}

function inspectAndStrip(nodeList) {
  for (const node of nodeList) {
    if (isCookieNotice(node)) {

      // check if position:fixed
      if (isFixed(node)) {
        node.remove()
        return true
      }
      
      // else check if div is on top screen border
      var rect = node.getBoundingClientRect()
      if (rect.top == 0) {
        node.remove()
        return true
      }

      // else search for fixed node in direct children
      for (const child of node.children) {
        if (isFixed(child)) {
          child.remove()
          return true
        }
      }

      // otherwise not a cookie notice
    }

    // nodeList loop end
  }

  return false // if not successful (true) before
}

// run initially (after dom content loaded)
var divs = document.querySelectorAll('div')
inspectAndStrip(divs)
var sections = document.querySelectorAll('section')
inspectAndStrip(sections)


// watch for changes

// callback function to execute when mutations are observed
var callback = function (mutationRecords) {
  var addedNodes = []

  for (const mut of mutationRecords) {
    var nodeList = mut.addedNodes
    
    var ary = Array.prototype.slice.call(nodeList)
    ary = ary.filter(node => {
      return node.tagName == 'DIV' || node.tagName == 'SECTION'
    })

    addedNodes = addedNodes.concat(ary)
  }

  inspectAndStrip(addedNodes)

  // TODO are all those elements already rendered?
}

var observer = new MutationObserver(callback)
var config = { attributes: false, childList: true, subtree: true }
observer.observe(document.body, config)
