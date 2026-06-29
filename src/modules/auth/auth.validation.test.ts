import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  resetPasswordSchema,
  sendVerificationOtpSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} from "./auth.validation.js";

describe("signUpSchema", () => {
  it("accepts a valid sign-up payload", () => {
    const result = v.safeParse(signUpSchema, {
      name: "Yaman",
      email: "yaman@example.com",
      password: "Sup3rSecret!23",
      confirmPassword: "Sup3rSecret!23",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a password missing a special character", () => {
    const result = v.safeParse(signUpSchema, {
      name: "Yaman",
      email: "yaman@example.com",
      password: "Sup3rSecret123",
      confirmPassword: "Sup3rSecret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when password and confirmPassword don't match", () => {
    const result = v.safeParse(signUpSchema, {
      name: "Yaman",
      email: "yaman@example.com",
      password: "Sup3rSecret!23",
      confirmPassword: "Different!23",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.message === "Passwords do not match")).toBe(
        true,
      );
    }
  });

  it("lowercases and trims the email", () => {
    const result = v.safeParse(signUpSchema, {
      name: "Yaman",
      email: "  Yaman@Example.com  ",
      password: "Sup3rSecret!23",
      confirmPassword: "Sup3rSecret!23",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.email).toBe("yaman@example.com");
    }
  });
});

describe("signInSchema", () => {
  it("requires a non-empty password", () => {
    const result = v.safeParse(signInSchema, {
      email: "yaman@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("sendVerificationOtpSchema", () => {
  it("accepts an email verification request", () => {
    const result = v.safeParse(sendVerificationOtpSchema, {
      email: "  Yaman@Example.com  ",
      type: "email-verification",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.email).toBe("yaman@example.com");
    }
  });

  it("rejects unsupported OTP types", () => {
    const result = v.safeParse(sendVerificationOtpSchema, {
      email: "yaman@example.com",
      type: "sign-in",
    });

    expect(result.success).toBe(false);
  });
});

describe("verifyEmailSchema", () => {
  it("accepts a 6-digit OTP", () => {
    const result = v.safeParse(verifyEmailSchema, {
      email: "yaman@example.com",
      otp: "123456",
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-6-digit OTPs", () => {
    const result = v.safeParse(verifyEmailSchema, {
      email: "yaman@example.com",
      otp: "12345",
    });

    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts OTP-based password reset payloads", () => {
    const result = v.safeParse(resetPasswordSchema, {
      email: "yaman@example.com",
      otp: "123456",
      newPassword: "Sup3rSecret!23",
      confirmPassword: "Sup3rSecret!23",
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched reset passwords", () => {
    const result = v.safeParse(resetPasswordSchema, {
      email: "yaman@example.com",
      otp: "123456",
      newPassword: "Sup3rSecret!23",
      confirmPassword: "Different!23",
    });

    expect(result.success).toBe(false);
  });
});
