import * as pg from "pg";
import { graphql, printSchema } from "graphql";
import {
  createPostGraphileSchema,
  PostGraphileCoreOptions,
} from "postgraphile-core";
import postgraphileAuditPlugin from "../src";
import { GraphQLSchema } from "graphql";

let pgPool: pg.Pool | null;

beforeAll(() => {
  pgPool = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });
});

afterAll(() => {
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
});

function buildTestSchema(override?: PostGraphileCoreOptions) {
  return createPostGraphileSchema(pgPool!, ["postgraphile_audit_plugin"], {
    disableDefaultMutations: true,
    appendPlugins: [postgraphileAuditPlugin],
    simpleCollections: "only",
    graphileBuildOptions: {
      auditPlugin: {
        auditFunctionSchema: "postgraphile_audit_plugin",
        auditEventConnection: true,
        firstLastAuditEvent: true,
        dateProps: true,
        nameProps: false,
        nameSource: "session_info",
        nameSessionInfoJsonPath: "{nested,name}",
      },
    },
    ...override,
  });
}

async function queryWithTestSchema(
  schema: GraphQLSchema | Promise<GraphQLSchema>,
  query: string
) {
  const pgClient = await pgPool!.connect();
  try {
    return graphql(await schema, query, null, { pgClient }, {});
  } finally {
    pgClient.release();
  }
}

test("schema", async () => {
  const schemaWithout = await buildTestSchema({ appendPlugins: [] });
  expect(schemaWithout).toMatchSnapshot("external schema without plugin");

  const schema = await buildTestSchema();
  expect(schema).toMatchSnapshot("external schema with plugin");

  expect(printSchema(schemaWithout)).not.toEqual(printSchema(schema));
});
