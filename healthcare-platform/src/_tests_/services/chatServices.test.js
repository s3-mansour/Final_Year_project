
import * as svc from "../../services/chatService";
import API from "../../services/api";

jest.mock("../../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe("chatService", () => {
  afterEach(() => jest.resetAllMocks());

  it("getConversations() returns array from API", async () => {
    const convs = [{ _id: "c1" }];
    API.get.mockResolvedValue({ data: convs });
    const result = await svc.getConversations();
    expect(API.get).toHaveBeenCalledWith("/api/chat");
    expect(result).toEqual(convs);
  });

  it("findOrCreateConversation() throws if no recipientId", async () => {
    await expect(svc.findOrCreateConversation("")).rejects.toThrow("Recipient ID is required");
  });

  it("findOrCreateConversation() calls POST and returns conv", async () => {
    const conv = { _id: "c2" };
    API.post.mockResolvedValue({ data: conv });
    const result = await svc.findOrCreateConversation("u2");
    expect(API.post).toHaveBeenCalledWith("/api/chat/findOrCreate", { recipientId: "u2" });
    expect(result).toBe(conv);
  });

  it("getMessages() returns default when no ID", async () => {
    const res = await svc.getMessages("", 1, 10);
    expect(res).toEqual({ messages: [], currentPage: 1, totalPages: 0, totalMessages: 0 });
  });
});
