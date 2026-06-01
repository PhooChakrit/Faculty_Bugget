import prisma from "@/lib/prisma";
import { mockActors } from "@/lib/mock-actors";

export async function ensureMockActor(userId: string) {
  const mockActor = mockActors.find((actor) => actor.id === userId);

  if (!mockActor) {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  return prisma.user.upsert({
    where: { id: mockActor.id },
    update: {
      email: mockActor.email,
      name: mockActor.name,
    },
    create: {
      id: mockActor.id,
      email: mockActor.email,
      name: mockActor.name,
    },
  });
}
