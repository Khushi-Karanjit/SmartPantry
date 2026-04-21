/**
 * SmartPantry — System Tests (End-to-End via Jest + Supertest)
 * Student ID: 210273
 *
 * These tests simulate real user workflows:
 * Frontend → Backend → Database (MongoDB Atlas)
 *
 * Each test maps to a documented system test case (TC-S-01 to TC-S-20).
 * External API calls (AbstractAPI) are MOCKED to ensure 100% deterministic success.
 */

require("dotenv").config();
const request   = require("supertest");
const mongoose  = require("mongoose");
const { createApp } = require("./src/app");

const app = createApp();

// ─── Shared state across tests ───────────────────────────────────────────────
let userToken   = ""; 
let adminToken  = ""; 
let userId      = "";
let pantryItemId = "";
let recipeId    = "";
let ingredientId = ""; // To be fetched

const TIMESTAMP  = Date.now();
const TEST_EMAIL = `systemtest_${TIMESTAMP}@gmail.com`;
const TEST_USER  = `testuser_${TIMESTAMP}`;
const TEST_PASS  = "SecurePass123";

const ADMIN_EMAIL = `admin_${TIMESTAMP}@gmail.com`;
const ADMIN_PASS  = "AdminPass123";

// ─── DB Setup / Teardown ─────────────────────────────────────────────────────
beforeAll(async () => {
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
});

afterAll(async () => {
  if (userId) {
    await mongoose.connection.db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  }
  await mongoose.connection.db.collection("users").deleteOne({ email: ADMIN_EMAIL });
  await mongoose.disconnect();
});

// ─── AbstractAPI Mocking Helper ──────────────────────────────────────────────
function mockAbstractResponse(overrides = {}) {
  const defaultResponse = {
    email_address: "test@gmail.com",
    email_deliverability: { status: "deliverable", status_detail: "valid_email", is_format_valid: true, is_smtp_valid: true, is_mx_valid: true },
    email_quality: { score: 0.8, is_disposable: false, is_free_email: true },
    email_risk: { address_risk_status: "low", domain_risk_status: "low" }
  };
  const finalResponse = {
    ...defaultResponse,
    ...overrides,
    email_deliverability: { ...defaultResponse.email_deliverability, ...(overrides.email_deliverability || {}) },
    email_quality: { ...defaultResponse.email_quality, ...(overrides.email_quality || {}) },
    email_risk: { ...defaultResponse.email_risk, ...(overrides.email_risk || {}) }
  };
  global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(finalResponse) }));
}

afterEach(() => {
  if (global.fetch && jest.isMockFunction(global.fetch)) global.fetch.mockClear();
});

// =============================================================================
//  MODULE 1 — USER AUTHENTICATION
// =============================================================================

describe("MODULE 1 — User Authentication", () => {

  test("TC-S-01 | Register a new user with a real email address", async () => {
    mockAbstractResponse();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: TEST_USER, email: TEST_EMAIL, password: TEST_PASS });
    expect([200, 201]).toContain(res.statusCode);
    userId = res.body.user.id;
  });

  test("TC-S-02 | Block registration with a fake domain", async () => {
    mockAbstractResponse({ email_deliverability: { is_mx_valid: false, status: "undeliverable" } });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `fake_${TIMESTAMP}`, email: `user@notfound${TIMESTAMP}.xyz`, password: TEST_PASS });
    expect(res.statusCode).toBe(400);
  });

  test("TC-S-03 | Registered user logs in", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ usernameOrEmail: TEST_EMAIL, password: TEST_PASS });
    expect(res.statusCode).toBe(200);
    userToken = res.body.token;
  });

});

// =============================================================================
//  MODULE 2 — EMAIL VERIFICATION
// =============================================================================

describe("MODULE 2 — Email Verification Scenarios", () => {
  test("TC-S-20 | Disposable email blocked", async () => {
    mockAbstractResponse({ email_quality: { is_disposable: true } });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `disp_${TIMESTAMP}`, email: `trash@mailinator.com`, password: TEST_PASS });
    expect(res.statusCode).toBe(400);
  });
});

// =============================================================================
//  MODULE 3 — PANTRY MANAGEMENT
// =============================================================================

describe("MODULE 3 — Pantry Management", () => {

  test("Setup: Fetch an ingredient ID first", async () => {
    const res = await request(app)
      .get("/api/ingredients?search=Milk")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    const ings = res.body.ingredients || res.body;
    expect(ings.length).toBeGreaterThan(0);
    ingredientId = ings[0]._id;
  });

  test("TC-S-05 | Add item to pantry", async () => {
    const res = await request(app)
      .post("/api/pantry")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ingredientId, quantity: 2, unit: "litres" });
    expect([200, 201]).toContain(res.statusCode);
    const item = res.body.item || res.body;
    pantryItemId = item._id;
  });

  test("TC-S-05b | Pantry list returns the item", async () => {
    const res = await request(app).get("/api/pantry").set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    const items = res.body.items || res.body;
    expect(items.length).toBeGreaterThan(0);
  });

  test("TC-S-08 | Restock functionality", async () => {
    const res = await request(app)
      .patch(`/api/pantry/${pantryItemId}/restock`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 });
    expect(res.statusCode).toBe(200);
  });

});

// =============================================================================
//  MODULE 4 — RECIPE DISCOVERY
// =============================================================================

describe("MODULE 4 — Recipe Discovery", () => {
  test("TC-S-09 | Recipe catalogue loads", async () => {
    const res = await request(app).get("/api/recipes").set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// =============================================================================
//  MODULE 6 — MEAL PLANNER & SHOPPING LIST
// =============================================================================

describe("MODULE 6 — Meal Planner & Shopping List", () => {
  test("TC-S-24 | Shopping list current endpoint", async () => {
    const res = await request(app)
      .get("/api/shopping-lists/current")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// =============================================================================
//  MODULE 8 — ADMIN PANEL
// =============================================================================

describe("MODULE 8 — Admin Panel", () => {
  test("TC-S-28a | Admin register & login", async () => {
    mockAbstractResponse();
    await request(app).post("/api/auth/register").send({ username: `adm_${TIMESTAMP}`, email: ADMIN_EMAIL, password: ADMIN_PASS });
    const res = await request(app).post("/api/auth/login").send({ usernameOrEmail: ADMIN_EMAIL, password: ADMIN_PASS });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("admin");
    adminToken = res.body.token;
  });

  test("TC-S-28b | Admin stats access", async () => {
    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// =============================================================================
//  MODULE 9 — DATA CONSISTENCY
// =============================================================================

describe("MODULE 9 — Data Consistency", () => {
  test("TC-S-17 | Dashboard summary endpoint", async () => {
    const res = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
  });

  test("TC-S-19b | Health check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
