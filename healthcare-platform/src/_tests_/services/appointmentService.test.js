// src/__tests__/services/appointmentService.test.js
import * as appointmentService from "../../services/appointmentService";
import API from "../../services/api";

// Mock out the entire API module so we never load axios itself
jest.mock("../../services/api", () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

describe("appointmentService", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("getAppointments should call API.get and return its data", async () => {
    const fakeData = [{ _id: "a1", date: "2025-05-10", time: "10:00" }];
    // API.get returns { data: ... }
    API.get.mockResolvedValue({ data: fakeData });

    const result = await appointmentService.getAppointments();

    expect(API.get).toHaveBeenCalledWith("/api/appointments");
    expect(result).toEqual(fakeData);
  });

  it("deleteAppointment should call API.delete and return its data", async () => {
    const fakeResp = { success: true };
    API.delete.mockResolvedValue({ data: fakeResp });

    const result = await appointmentService.deleteAppointment("a1");

    expect(API.delete).toHaveBeenCalledWith("/api/appointments/a1");
    expect(result).toEqual(fakeResp);
  });
});
