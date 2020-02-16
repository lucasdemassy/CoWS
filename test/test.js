const assert = require("assert");
const expect = require("chai").expect;



describe("Test", () => {
  it("addition", () => {
    assert.equal(3+8, 11);
  });
/*
  describe("DB", () => {
    const influx = require("influx");
    const influxClient = new influx.InfluxDB("http://localhost:8086/test");
    it("connection", async () => {
      var connection = await testConnection(influxClient);
      expect(connection[0].online).to.equal(true);
    });
    it("_options in influxClient", () => {
      assert("_options" in influxClient);
    });
    it("database in _options", () => {
      assert("database" in influxClient._options);
    });
    it("database test exist", () => {
      assert.equal(influxClient._options.database, "test");
    });
  });
*/
});
