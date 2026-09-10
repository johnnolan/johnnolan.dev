const COOKIE_NAME = "JNDEV_COOKIES";
const scriptConfiguration = document.currentScript.dataset;
const body = document.body;
let analyticsInitialised = false;

function getCookie(name) {
  const namePrefix = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trimStart();
    if (cookie.startsWith(namePrefix)) {
      return decodeURIComponent(cookie.substring(namePrefix.length));
    }
  }
  return null;
}

function analyticsAllowed() {
  const disabledHostnames = scriptConfiguration.disabledHostnames.split(",");
  return getCookie(COOKIE_NAME) === "accept" && !disabledHostnames.includes(location.hostname);
}

function setupAnalytics() {
  if (analyticsInitialised || !analyticsAllowed()) return;
  analyticsInitialised = true;

  const analyticsScript = document.createElement("script");
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${scriptConfiguration.googleAnalyticsId}`;
  document.head.appendChild(analyticsScript);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", scriptConfiguration.googleAnalyticsId, {
    transport_type: "beacon",
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_title: document.title,
    page_path: location.pathname.split("?")[0],
  });

  const cloudflareScript = document.createElement("script");
  cloudflareScript.src = "https://static.cloudflareinsights.com/beacon.min.js";
  cloudflareScript.dataset.cfBeacon = JSON.stringify({
    token: scriptConfiguration.cloudflareBeaconToken,
  });
  cloudflareScript.async = true;
  body.appendChild(cloudflareScript);
}

function setCookie(name, value, options = { days: 365 }) {
  const maxAge = options.days * 24 * 60 * 60;
  const cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; Secure; SameSite=Strict;`;
  document.cookie = cookie;
  return cookie;
}

function hideBanner() {
  body.querySelector(".cookie-banner")?.classList.toggle("hide", true);
}

function cookieClicked(result) {
  setCookie(COOKIE_NAME, result);
  hideBanner();
  setupAnalytics();
}

document.addEventListener("click", (event) => {
  const element = event.target.closest("[data-module='cookie-button']");
  if (element) cookieClicked(element.value);
});

if (getCookie(COOKIE_NAME) !== null) hideBanner();
setupAnalytics();
