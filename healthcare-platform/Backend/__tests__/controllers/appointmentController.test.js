// Backend/__tests__/controllers/appointmentController.test.js
const { createAppointment } = require("../../controllers/appointmentController");

describe("createAppointment controller", () => {
  let req, res;

  beforeEach(() => {
    // only testing the "missing date/time" branch here
    req = { body: {}, user: { _id: "u1" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should respond 400 if date or time is missing", async () => {
    await createAppointment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please provide both date and time.",
    });
  });
});
