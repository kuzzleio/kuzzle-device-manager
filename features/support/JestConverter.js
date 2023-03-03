const { createWriteStream } = require("fs");

class JestConverter {
  constructor () {
    const filename = process.env.JEST_FILENAME;
    this.module = process.env.JEST_MODULE;

    const path = `./tests/migrated/${filename}.test.ts`;

    console.log(`Create file ${path}`);
    this.file = createWriteStream(`${path}`, { encoding: 'utf-8'});
  }

  writeFileBeginning() {
    this.file.write(`
      import { beforeEachTruncateCollections } from "../hooks/collections";
      import { beforeAllCreateEngines } from "../hooks/engines";
      import { beforeEachLoadFixtures } from "../hooks/fixtures";

      import { useSdk, sendPayloads } from "../helpers";

      jest.setTimeout(10000);

      describe("${this.module}", () => {
        const sdk = useSdk();

        beforeAll(async () => {
          await sdk.connect();
          await beforeAllCreateEngines(sdk);
        });

        beforeEach(async () => {
          await beforeEachTruncateCollections(sdk);
          await beforeEachLoadFixtures(sdk);
        });

        afterAll(async () => {
          sdk.disconnect();
        });
      `);
  }

  writeTestCaseBeginning (name) {
    this.file.write(`
      it("${name}", async () => {
        let response;
        let promise;
    `);
  }

  write (content) {
    this.file.write(content);
  }

  writeTestCaseEnd () {
    this.file.write(`
      });
    `);
  }

  writeFileEnd() {
    this.file.write(`
      });
    `);
  }

  close() {
    this.file.end();
  }
}

module.exports = { JestConverter };