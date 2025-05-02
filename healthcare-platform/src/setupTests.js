// src/setupTests.js
// Load custom matchers and suppress unwanted warnings/errors
import '@testing-library/jest-dom';  // Adds toBeInTheDocument and other matchers

// Silence React Router v6 “future flag” warnings in tests:
const realWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("React Router Future Flag Warning") ||
     args[0].includes("Relative route resolution within Splat routes is changing in v7"))
  ) {
    return;
  }
  realWarn(...args);
};

// Silence JSDOM "Not implemented" errors and Login page console.error noise:
const realError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Not implemented") ||
     args[0].startsWith("Login Error:"))
  ) {
    return;
  }
  realError(...args);
};
