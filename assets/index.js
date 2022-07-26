var GA_ANALYTICS_ID = "UA-92772847-1";

function setupGoogleAnalytics(analyticsId) {
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
    linker: {
      domains: ["www.gov.uk"],
    },
    transport_type: "beacon",
    anonymize_ip: true, // https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
    allow_google_signals: false, // https://developers.google.com/analytics/devguides/collection/gtagjs/display-features
    allow_ad_personalization_signals: false, // https://developers.google.com/analytics/devguides/collection/gtagjs/display-features
    page_title: document.title,
    page_path: location.pathname.split("?")[0],
  });
}

setupGoogleAnalytics(GA_ANALYTICS_ID);
