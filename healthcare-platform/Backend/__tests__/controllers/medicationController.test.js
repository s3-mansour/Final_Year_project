const mongoose = require("mongoose");
const httpMocks = require("node-mocks-http");

jest.mock("../../models/Medication");
const Medication = require("../../models/Medication");
const { getPatientMedications } = require("../../controllers/medicationController");

describe("medicationController", () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toHexString();

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    Medication.find.mockReset();
  });

  it("getPatientMedications → 200 + patient meds", async () => {
    req.user = { role: "patient", _id: validId, email: "p@e.com" };
    const fake = [{ _id: "m1", name: "MedA" }];
    Medication.find.mockReturnValue({ sort: () => fake });

    await getPatientMedications(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(fake);
    expect(Medication.find).toHaveBeenCalledWith({ patient: validId });
  });
});
