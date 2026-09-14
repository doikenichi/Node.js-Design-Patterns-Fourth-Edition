import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { after, mock, suite, test } from "node:test";
import { setImmediate } from "node:timers/promises";

const sampleRecords = [
  {
    id: 1,
    userId: "user1",
    balance: 10,
    expiresAt: new Date(Date.now() + 1000),
  },
  {
    id: 2,
    userId: "user1",
    balance: 5,
    expiresAt: new Date(Date.now() + 1000),
  },
  {
    id: 3,
    userId: "user1",
    balance: 3,
    expiresAt: new Date(Date.now() + 1000),
  },
  {
    id: 4,
    userId: "user2",
    balance: 18,
    expiresAt: new Date(Date.now() + 1000),
  },
];

// The mocked module is installed once for the whole test file. If we put
// the mock function directly on DbMock, every concurrent test would share
// the same call history. AsyncLocalStorage lets us keep the module mock
// global, while making the query mock local to each async test execution.
const queryMocks = new AsyncLocalStorage();

function withQueryMock(fn) {
  // Each test creates a fresh mock, so call-count assertions are isolated.
  const queryMock = mock.fn(async (_sql, params) => {
    // Yield back to the event loop to make the tests genuinely overlap when
    // the suite runs with concurrency enabled.
    await setImmediate();

    // The real database would apply the WHERE clause. Since this fake query
    // returns in-memory data, it has to preserve the same observable contract.
    const [userId] = params;
    return sampleRecords.filter((record) => record.userId === userId);
  });

  // Any asynchronous work started by fn() can retrieve this same queryMock
  // later with queryMocks.getStore(). That is the bridge between the test
  // body and the mocked DbClient below.
  return queryMocks.run(queryMock, () => fn(queryMock));
}

mock.module("./dbClient.js", {
  cache: false,
  exports: {
    // biome-ignore lint/style/useNamingConvention: class name mirrors the real export
    DbClient: class DbMock {
      async query(sql, params) {
        // payments.js creates one DbClient at module load time. That instance
        // is shared, but the query mock is resolved at call time from the
        // async context of the test that triggered this query.
        const queryMock = queryMocks.getStore();

        if (!queryMock) {
          throw new Error("Query mock not configured for test");
        }

        return queryMock(sql, params);
      }
    },
  },
});

const { canPayWithVouchers } = await import("./payments.js");

suite("canPayWithVouchers", { concurrency: true, timeout: 500 }, () => {
  after(() => {
    queryMocks.disable();
  });

  test("Returns true if balance is enough", async () => {
    await withQueryMock(async (queryMock) => {
      const result = await canPayWithVouchers("user1", 18);

      assert.equal(result, true);
      assert.equal(queryMock.mock.callCount(), 1);
    });
  });

  test("Returns false if balance is not enough", async () => {
    await withQueryMock(async (queryMock) => {
      const result = await canPayWithVouchers("user2", 19);

      assert.equal(result, false);
      assert.equal(queryMock.mock.callCount(), 1);
    });
  });
});
