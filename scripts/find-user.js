const { PrismaClient } = require("../app/generated/prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.findUnique({
      where: { email: "somchai.t@chula.ac.th" },
    });
    console.log(JSON.stringify(u, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
