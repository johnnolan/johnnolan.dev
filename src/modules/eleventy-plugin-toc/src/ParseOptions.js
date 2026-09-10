const ParseOptions = (userOptions, defaultOptions) => {
  let safeDefaultOptions = {};
  let safeUserOptions = {};

  if (defaultOptions && defaultOptions.constructor === {}.constructor) {
    safeDefaultOptions = defaultOptions;
  }

  if (userOptions && typeof userOptions === "string") {
    try {
      safeUserOptions = JSON.parse(userOptions);
    } catch {
      // Malformed local options fall back to the configured defaults.
    }
  } else if (userOptions && userOptions.constructor === {}.constructor) {
    safeUserOptions = userOptions;
  }

  return Object.assign({}, safeDefaultOptions, safeUserOptions);
};

module.exports = ParseOptions;
