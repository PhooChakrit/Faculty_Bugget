import "dotenv/config";
import prisma from "@/lib/prisma";

async function main() {
  // Ensure somchai user exists
  const email = "somchai.t@chula.ac.th";
  let somchai = await prisma.user.findUnique({ where: { email } });
  if (!somchai) {
    somchai = await prisma.user.create({
      data: { email, name: "Somchai Test" },
    });
    console.log("Created user:", somchai);
  } else {
    console.log("Found user:", somchai.id);
  }

  // Pick an actor user (any existing user) to perform the assignment
  let actor = await prisma.user.findFirst();
  if (!actor) {
    actor = await prisma.user.create({
      data: { email: "admin@example.com", name: "Auto Admin" },
    });
    console.log("Created actor user:", actor.id);
  } else {
    console.log("Using actor user:", actor.id);
  }

  // Upsert the department head assignment directly via Prisma
  const assignment = await prisma.departmentHeadAssignment.upsert({
    where: { department: "sci" },
    create: {
      department: "sci",
      headUserId: somchai.id,
      assignedByUserId: actor.id,
    },
    update: {
      headUserId: somchai.id,
      assignedByUserId: actor.id,
    },
    include: {
      headUser: { select: { id: true, name: true, email: true } },
      assignedByUser: { select: { id: true, name: true, email: true } },
    },
  });

  console.log("Upserted assignment:", JSON.stringify(assignment, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
