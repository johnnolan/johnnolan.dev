var GA_ANALYTICS_ID = "G-F1C9XCHGQX";
var COOKIE_NAME = "JNDEV_COOKIES";
var body = document.getElementsByTagName("body")[0];

function setupGoogleAnalytics(analyticsId) {
  var isCookieAccepted = getCookie(COOKIE_NAME);
  if (isCookieAccepted === null || isCookieAccepted === "reject") {
    return;
  }

  if (location.hostname === "localhost") {
    return;
  }

  var s = document.createElement("script");
  s.type = "text/javascript";
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + analyticsId;
  document.getElementsByTagName("head")[0].appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", analyticsId, {
    transport_type: "beacon",
    anonymize_ip: true, // https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
    allow_google_signals: false, // https://developers.google.com/analytics/devguides/collection/gtagjs/display-features
    allow_ad_personalization_signals: false, // https://developers.google.com/analytics/devguides/collection/gtagjs/display-features
    page_title: document.title,
    page_path: location.pathname.split("?")[0],
  });

  var scf = document.createElement("script");
  scf.src = "https://static.cloudflareinsights.com/beacon.min.js";
  scf.setAttribute("data-cf-beacon", "{'token': '30bebefbd39f472b98f50e2b18eef67c'}");
  scf.async = true;
  document.body.appendChild(scf);
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0, len = cookies.length; i < len; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

function setCookie(name, value, options) {
  if (typeof options === "undefined" || options.days === undefined) {
    options = { days: 365 };
  }

  const maxAge = options.days * 24 * 60 * 60;
  const cookie =
    `${name}=${encodeURIComponent(value)}` +
    "; path=/" +
    "; max-age=" +
    maxAge +
    "; Secure; SameSite=Strict;";
  document.cookie = cookie;
  return cookie;
}

function cookieClicked(result) {
  setCookie(COOKIE_NAME, result);
  hideBanner();
}

function hideBanner() {
  body.getElementsByClassName("cookie-banner")[0].classList.toggle("hide", true);
}

document.addEventListener("click", (e) => {
  var element = e.target;
  if (element.dataset.module === "cookie-button") {
    cookieClicked(element.getAttribute("value"));
  }
});

if (getCookie(COOKIE_NAME) !== null) {
  hideBanner();
}

setupGoogleAnalytics(GA_ANALYTICS_ID);
