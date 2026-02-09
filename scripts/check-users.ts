import "dotenv/config";
import prisma from "@/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Available Configured Users:", JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log("No users found. Creating a test user...");
    const newUser = await prisma.user.create({
      data: {
        email: "test-admin@example.com",
        name: "Test Admin",
      },
    });
    console.log("Created User:", newUser);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
