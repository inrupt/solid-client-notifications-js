import sampleModuleFn from "./module";
import * as TestFns from "./index";

describe("exports", () => {
  it("includes all of the expected functions", () => {
    expect(Object.keys(TestFns)).toEqual(["sampleModuleFn"]);
    expect(TestFns.sampleModuleFn()).toEqual(sampleModuleFn());
  });
});
