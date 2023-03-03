const _ = require("lodash");
const { BeforeAll, AfterAll, Before, After } = require("cucumber");

BeforeAll(async function () {
  global.converter.writeFileBeginning();
});

AfterAll(async function () {
  global.converter.writeFileEnd();
  global.converter.close();
});

Before(async function (scenario) {
  global.converter.writeTestCaseBeginning(scenario.pickle.name);
});

After(async function () {
  global.converter.writeTestCaseEnd();
});