import { auth, driver } from "neo4j-driver";

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  throw new Error("NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD are required.");
}

const neo4jDriver = driver(uri, auth.basic(user, password));
const session = neo4jDriver.session();

const constraints = [
  "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
  "CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE",
  "CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
  "CREATE CONSTRAINT goal_id_unique IF NOT EXISTS FOR (g:Goal) REQUIRE g.id IS UNIQUE",
  "CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE"
];

try {
  for (const constraint of constraints) {
    await session.run(constraint);
    console.warn(`Applied Neo4j constraint: ${constraint}`);
  }
} finally {
  await session.close();
  await neo4jDriver.close();
}
