import sampleModuleFn from "./index";

describe("sampleModuleFn", () => {
  it("returns the expected value", () => {
    expect(sampleModuleFn()).toEqual("Hello, world- from a module.");
  });
});
