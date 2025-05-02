// src/__tests__/services/medicationService.test.js
import * as svc from "../../services/medicationService";
import API from "../../services/api";

jest.mock("../../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("medicationService", () => {
  afterEach(() => jest.resetAllMocks());

  it("getMedications() with no patientId calls GET /api/medications", async () => {
    API.get.mockResolvedValue({ data: [{ _id: "m1" }] });
    const result = await svc.getMedications();
    expect(API.get).toHaveBeenCalledWith("/api/medications", {});
    expect(result).toEqual([{ _id: "m1" }]);
  });

  it("getMedications() with patientId calls GET /api/medications?patientId=", async () => {
    API.get.mockResolvedValue({ data: [] });
    await svc.getMedications("p2");
    expect(API.get).toHaveBeenCalledWith("/api/medications", { params: { patientId: "p2" } });
  });

  it("createMedication() calls POST and returns new med", async () => {
    const newMed = { name: "X" };
    API.post.mockResolvedValue({ data: newMed });
    const result = await svc.createMedication(newMed);
    expect(API.post).toHaveBeenCalledWith("/api/medications", newMed);
    expect(result).toBe(newMed);
  });

  it("deleteMedication() calls DELETE and returns response", async () => {
    API.delete.mockResolvedValue({ data: { success: true } });
    const result = await svc.deleteMedication("m1");
    expect(API.delete).toHaveBeenCalledWith("/api/medications/m1");
    expect(result).toEqual({ success: true });
  });
});
