import { PrismaClient } from "@prisma/client";

type GlobalWithPrisma = {
  prisma?: PrismaClient;
};

const globalState = globalThis as unknown as GlobalWithPrisma;

let prismaClient = globalState.prisma;

if (!prismaClient) {
  prismaClient = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalState.prisma = prismaClient;
  }
}

export function getPrismaClient() {
  return prismaClient as PrismaClient;
}

export type PrismaClientLike = PrismaClient;
