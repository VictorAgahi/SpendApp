import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    process.env.NEO4J_URI as string,
    neo4j.auth.basic(process.env.NEO4J_USERNAME as string, process.env.NEO4J_PASSWORD as string)
);



async function createIndexes() {
    const session = driver.session();
    try {
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.email)`);
        await session.run(`CREATE INDEX IF NOT EXISTS FOR (e:Expense) ON (e.deadline)`);
        console.log("Indexes created successfully.");
    } catch (error) {
        console.error("Error creating indexes:", error);
    } finally {
        await session.close();
    }
}

createIndexes();

export default driver;