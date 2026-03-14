;(function () {
  if (window.__levelLineReservationConversionInstalled) {
    return
  }

  window.__levelLineReservationConversionInstalled = true

  var conversionSendTo = 'AW-18011386164/cNKaCPa5u4gcELTiv4xD'
  var navigationFallbackDelay = 1000

  function isLineReservationLink(anchor) {
    if (!anchor || !anchor.href) {
      return false
    }

    var href = anchor.href.toLowerCase()
    return href.indexOf('line.me') !== -1 || href.indexOf('lin.ee') !== -1
  }

  function shouldDelayNavigation(anchor, event) {
    if (event.button !== 0) {
      return false
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false
    }

    if (anchor.target && anchor.target.toLowerCase() === '_blank') {
      return false
    }

    if (anchor.hasAttribute('download')) {
      return false
    }

    return true
  }

  document.addEventListener('click', function (event) {
    if (event.__levelLineReservationConversionHandled) {
      return
    }

    var target = event.target
    if (!target || typeof target.closest !== 'function') {
      return
    }

    var anchor = target.closest('a[href]')
    if (!isLineReservationLink(anchor)) {
      return
    }

    event.__levelLineReservationConversionHandled = true

    var href = anchor.href
    var shouldNavigateAfterCallback = shouldDelayNavigation(anchor, event)
    var hasNavigated = false

    function continueNavigation() {
      if (hasNavigated) {
        return
      }

      hasNavigated = true

      if (shouldNavigateAfterCallback) {
        window.location.href = href
      }
    }

    if (shouldNavigateAfterCallback) {
      event.preventDefault()
      window.setTimeout(continueNavigation, navigationFallbackDelay)
    }

    if (typeof window.gtag !== 'function') {
      continueNavigation()
      return
    }

    window.gtag('event', 'conversion', {
      send_to: conversionSendTo,
      event_callback: continueNavigation,
    })

    if (!shouldNavigateAfterCallback) {
      hasNavigated = true
    }
  })
})()
