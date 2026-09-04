/**
 * @jest-environment node
 */

import { storageGet, storageSet } from "@/utils/storage";
import { Platform } from "react-native";

describe("storage utilities", () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalOS = Platform.OS;

  beforeEach(() => {
    (Platform as { OS: string }).OS = "web";
    globalThis.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    } as unknown as Storage;
  });

  afterEach(() => {
    (Platform as { OS: string }).OS = originalOS;
    globalThis.localStorage = originalLocalStorage;
  });

  describe("storageGet", () => {
    it("returns value from localStorage on web", async () => {
      const mockGetItem = jest.fn().mockReturnValue("test-value");
      (globalThis.localStorage as any).getItem = mockGetItem;

      const result = await storageGet("demoMode");
      expect(mockGetItem).toHaveBeenCalledWith("mednexus:demoMode");
      expect(result).toBe("test-value");
    });

    it("returns null for non-existent key", async () => {
      const mockGetItem = jest.fn().mockReturnValue(null);
      (globalThis.localStorage as any).getItem = mockGetItem;

      const result = await storageGet("nonExistent");
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      const mockGetItem = jest.fn().mockImplementation(() => {
        throw new Error("Storage error");
      });
      (globalThis.localStorage as any).getItem = mockGetItem;

      const result = await storageGet("demoMode");
      expect(result).toBeNull();
    });
  });

  describe("storageSet", () => {
    it("sets value in localStorage on web", async () => {
      const mockSetItem = jest.fn();
      (globalThis.localStorage as any).setItem = mockSetItem;

      await storageSet("demoMode", "live");
      expect(mockSetItem).toHaveBeenCalledWith("mednexus:demoMode", "live");
    });

    it("does not throw on error", async () => {
      const mockSetItem = jest.fn().mockImplementation(() => {
        throw new Error("Storage error");
      });
      (globalThis.localStorage as any).setItem = mockSetItem;

      await expect(storageSet("demoMode", "live")).resolves.toBeUndefined();
    });
  });
});