import { expect, test } from "bun:test";
import { decodeBase64Url, isBlockedHost } from "./proxy-guard";

test("blocks private and reserved IPv4 literals", () => {
  for (const host of [
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "999.1.1.1",
  ]) {
    expect(isBlockedHost(host)).toBe(true);
  }
});

test("blocks IPv6 loopback, link-local, unique-local and multicast", () => {
  for (const host of ["::1", "::", "fe80::1", "fd00::1", "ff02::1"]) {
    expect(isBlockedHost(host)).toBe(true);
  }
});

test("re-checks the IPv4 inside an IPv4-mapped IPv6 literal", () => {
  expect(isBlockedHost("::ffff:127.0.0.1")).toBe(true);
  expect(isBlockedHost("::ffff:8.8.8.8")).toBe(false);
});

test("blocks internal hostnames", () => {
  for (const host of [
    "localhost",
    "LOCALHOST",
    "api.localhost",
    "printer.local",
    "db.internal",
    "",
  ]) {
    expect(isBlockedHost(host)).toBe(true);
  }
});

test("allows public hosts", () => {
  for (const host of [
    "example.com",
    "8.8.8.8",
    "172.32.0.1",
    "2606:4700::1111",
  ]) {
    expect(isBlockedHost(host)).toBe(false);
  }
});

test("decodes unpadded base64url and rejects malformed input", () => {
  expect(decodeBase64Url("aHR0cHM6Ly9hLmNvbS8_eD0-")).toBe(
    "https://a.com/?x=>",
  );
  expect(decodeBase64Url("a")).toBeNull();
  expect(decodeBase64Url("!!!!")).toBeNull();
});
