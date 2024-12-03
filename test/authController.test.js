const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { register, login, logout } = require("../controllers/authController");
const User = require("../models/userModel");

const app = express();
app.use(express.json());
app.post("/register", register);
app.post("/login", login);
app.post("/logout", logout);

// Mock User model methods
jest.mock("../models/userModel");

// Mock JWT methods
jest.mock("jsonwebtoken");

describe("Auth Controller Tests", () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeAll(() => {
    // Suppress console output during tests
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console functionality
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  // Test Suite for Register Function
  describe("POST /register", () => {
    it("should return 400 if any input is missing", async () => {
      const response = await request(app).post("/register").send({
        username: "",
        email: "",
        password: "",
        role: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Harap lengkapi data yang diinput");
    });

    it("should return 400 if email format is invalid", async () => {
      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "invalid-email",
        password: "password123",
        role: "user",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Format email tidak valid");
    });

    // it('should return 400 if the email is already registered', async () => {
    //     User.findOne.mockResolvedValue({ email: 'test@gmail.com' });

    //     const response = await request(app).post('/register').send({
    //         username: 'testuser',
    //         email: 'test@gmail.com',
    //         password: 'password123',
    //         role: 'user'
    //     });

    //     expect(response.status).toBe(400);
    //     expect(response.body.message).toBe('Email Anda telah terdaftar!');
    // });

    it("should return 400 if the email is already registered for a different role", async () => {
      User.findOne.mockResolvedValue({
        email: "test@gmail.com",
        role: "user",
      });

      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
        role: "admin",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Email Anda telah terdaftar untuk peran user. Tidak dapat mendaftar ulang sebagai admin."
      );
    });

    it("should return 400 if the email is already registered with the same role", async () => {
      User.findOne.mockResolvedValue({
        email: "test@gmail.com",
        role: "user",
      });

      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
        role: "user",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email Anda telah terdaftar!");
    });

    it("should create a new user and return 201", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        username: "testuser",
        email: "test@gmail.com",
        password: "hashedpassword",
        role: "user",
      });

      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
        role: "user",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Pendaftaran berhasil");
    });
    it("should handle server errors during registration", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
        role: "user",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Database connection failed");
    });

    // Testing password hashing
    it("should hash the password before saving", async () => {
      const salt = "mockedSalt";
      bcrypt.genSalt = jest.fn().mockResolvedValue(salt);
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword123");
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        username: "testuser",
        email: "test@gmail.com",
        password: "hashedPassword123",
        role: "user",
      });

      await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
        role: "user",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", salt);
    });

    // Testing email format variations
    it("should accept gmail.id domain", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        username: "testuser",
        email: "test@gmail.id",
        password: "hashedpassword",
        role: "user",
      });

      const response = await request(app).post("/register").send({
        username: "testuser",
        email: "test@gmail.id",
        password: "password123",
        role: "user",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // Test Suite for Login Function
  describe("POST /login", () => {
    it("should return 400 if any input is missing", async () => {
      const response = await request(app).post("/login").send({
        email: "",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Harap lengkapi data yang diinput");
    });

    it("should return 400 if email format is invalid", async () => {
      const response = await request(app).post("/login").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Format email tidak valid");
    });

    it("should return 404 if the user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/login").send({
        email: "notfound@gmail.com",
        password: "password123",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Pengguna tidak ditemukan");
    });

    it("should return 400 if the password is incorrect", async () => {
      User.findOne.mockResolvedValue({
        email: "test@gmail.com",
        password: "hashedpassword",
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app).post("/login").send({
        email: "test@gmail.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Kata sandi salah!");
    });

    it("should return 201 if login is successful", async () => {
      User.findOne.mockResolvedValue({
        _id: "123",
        username: "testuser",
        email: "test@gmail.com",
        password: "hashedpassword",
        role: "user",
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue("accessToken");

      const response = await request(app).post("/login").send({
        email: "test@gmail.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Login Success");
      expect(response.body.data.accessToken).toBe("accessToken");
    });
    // Testing refresh token generation and cookie setting
    it("should set refresh token cookie on successful login", async () => {
      const mockUser = {
        _id: "123",
        username: "testuser",
        email: "test@gmail.com",
        password: "hashedpassword",
        role: "user",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce("accessToken") // First call for access token
        .mockReturnValueOnce("refreshToken"); // Second call for refresh token

      User.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app).post("/login").send({
        email: "test@gmail.com",
        password: "password123",
      });

      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/refreshToken/);
    });

    // Testing server error handling
    it("should handle database errors during login", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/login").send({
        email: "test@gmail.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Internal Server Error");
    });

    // Testing role-based authentication
    it("should include user role in response and tokens", async () => {
      const mockUser = {
        _id: "123",
        username: "testuser",
        email: "test@gmail.com",
        password: "hashedpassword",
        role: "admin",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      const response = await request(app).post("/login").send({
        email: "test@gmail.com",
        password: "password123",
      });

      expect(response.body.data.userRole).toBe("admin");
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userRole: "admin" }),
        process.env.ACCESS_TOKEN_SECRET
      );
    });
  });

  // Test Suite for Logout Function
  describe("POST /logout", () => {
    it("should return 200 if logout is successful", async () => {
      const mockUser = {
        email: "test@example.com",
        refresh_token: "oldToken",
        save: jest.fn().mockResolvedValue(true),
      };

      const req = {
        body: { email: "test@example.com" },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      };

      User.findOne.mockResolvedValue(mockUser);

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    });

    it("should return 400 if email is missing", async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      };

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email diperlukan untuk keluar",
      });
    });

    // Testing database error handling
    it("should clear refresh token from database and cookies", async () => {
      let refreshToken = "oldRefreshToken";
      const mockUser = {
        email: "test@gmail.com",
        get refresh_token() {
          return refreshToken;
        },
        set refresh_token(value) {
          refreshToken = value;
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const req = {
        body: { email: "test@gmail.com" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      };

      User.findOne.mockResolvedValue(mockUser);

      await logout(req, res);

      expect(refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    });

    // Testing successful refresh token clearing
    it("should clear refresh token from database and cookies", async () => {
      let refreshToken = "oldRefreshToken";
      const mockUser = {
        email: "test@gmail.com",
        get refresh_token() {
          return refreshToken;
        },
        set refresh_token(value) {
          refreshToken = value;
        },
        save: jest.fn().mockResolvedValue(true),
      };

      const req = {
        body: { email: "test@gmail.com" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn(),
      };

      User.findOne.mockResolvedValue(mockUser);

      await logout(req, res);

      expect(refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    });
  });
  
  // Test untuk baris 227-228 (user not found case)
  it('should return 200 if user is not found', async () => {
    // Mock User.findOne to return null
    User.findOne.mockResolvedValue(null);
  
    const req = {
      body: { email: "notfound@gmail.com" }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn()
    };
  
    await logout(req, res);
  
    // Verifikasi bahwa log yang tepat dipanggil
    const logCalls = console.log.mock.calls;
    expect(logCalls[2][0]).toMatch(
      /\[\d{2}\/\d{2}\/\d{4}, \d{2}\.\d{2}\.\d{2}] : User not found for email: notfound@gmail.com/
    );
  
    // Verifikasi urutan log messages
    expect(logCalls[0][0]).toMatch(/Request body received at backend/);
    expect(logCalls[1][0]).toMatch(/Attempting to logout user/);
    expect(logCalls[2][0]).toMatch(/User not found for email/);
  
    // Verifikasi response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Pengguna sudah keluar"
    });
  });

  // Test untuk baris 247-248 (error handling)
  it("should handle server errors during logout", async () => {
    // Mock User.findOne to throw error
    const error = new Error("Database error");
    User.findOne.mockRejectedValue(error);

    const req = {
      body: { email: "test@gmail.com" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };

    await logout(req, res);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith("Logout error:", error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An error occurred during logout",
    });
  });
});
