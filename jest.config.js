// jest.config.js
module.exports = {
  // Specify the root directory for your tests
  roots: ["<rootDir>/__tests__"],

  // Use 'babel-jest' as a transformer for ES6 code
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Other Jest configurations...
};
