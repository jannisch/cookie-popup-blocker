const popupTagNames = ['DIV', 'SECTION', 'FOOTER', 'ASIDE', 'FORM']

function isFixed(node) {
  return window.getComputedStyle(node).position === 'fixed'
}

function isCookieNotice(node) {
  const attrs = [
    node.id,
    node.className,
    node.getAttribute('aria-label')
  ]
  return attrs.some(attr => /(cookie|gdpr|consent|privacy|opt-in)/i.test(attr))
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
const hostname = window.location.hostname
browser.storage.sync.get(hostname).then(res => {
  if (res[hostname] == 'i') {
    browser.runtime.sendMessage('ignored')
  } else {
    const blocked = popupTagNames.reduce((res, tag) => {
      const nodes = document.querySelectorAll(tag)
      if (inspectAndStrip(nodes)) res = true
      return res
    }, false)
    if (blocked) browser.runtime.sendMessage('blocked')
    createObserver()
  }
})

function createObserver() {
  // callback function to execute when mutations are observed
  var observer = new MutationObserver(mutationRecords => {
    var addedNodes = []

    for (const mut of mutationRecords) {
      var nodeList = mut.addedNodes

      var ary = Array.prototype.slice.call(nodeList)
      ary = ary.filter(node => popupTagNames.includes(node.tagName))

      addedNodes = addedNodes.concat(ary)
    }

    const blocked = inspectAndStrip(addedNodes)
    if (blocked) browser.runtime.sendMessage('blocked')
  })
  var config = { attributes: false, childList: true, subtree: true }
  observer.observe(document.body, config)
}