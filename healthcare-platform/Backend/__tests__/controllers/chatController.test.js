const mongoose = require("mongoose");
const httpMocks = require("node-mocks-http");

jest.mock("../../models/Conversation");
const Conversation = require("../../models/Conversation");
const { getConversations } = require("../../controllers/chatController");

describe("chatController", () => {
  let req, res;
  const userId = new mongoose.Types.ObjectId().toHexString();

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    Conversation.find.mockReset();
  });

  it("getConversations → 200 + list", async () => {
    req.user = { _id: userId };
    const fake = [{ _id: "c1" }];
    // mock the mongoose chaining: find().populate().populate().sort()
    const chain = {
      populate: () => ({
        populate: () => ({
          sort: () => fake,
        }),
      }),
    };
    Conversation.find.mockReturnValue(chain);

    await getConversations(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(fake);
    expect(Conversation.find).toHaveBeenCalledWith({ participants: userId });
  });
});
