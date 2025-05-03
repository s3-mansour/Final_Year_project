
import * as svc from "../../services/medicationLogService";
import API from "../../services/api";

jest.mock("../../services/api", () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe("medicationLogService", () => {
  afterEach(() => jest.resetAllMocks());

  it("logDose() calls POST and returns log", async () => {
    const log = { message: "ok" };
    API.post.mockResolvedValue({ data: log });
    const result = await svc.logDose({ scheduleItemId: "s1" });
    expect(API.post).toHaveBeenCalledWith("/api/medication-logs", { scheduleItemId: "s1" });
    expect(result).toBe(log);
  });

  it("getLogsForDate() calls GET with date param", async () => {
    API.get.mockResolvedValue({ data: [{ scheduleItemId: "s1" }] });
    const result = await svc.getLogsForDate("2025-05-02");
    expect(API.get).toHaveBeenCalledWith("/api/medication-logs", { params: { date: "2025-05-02" } });
    expect(result).toEqual([{ scheduleItemId: "s1" }]);
  });
});
