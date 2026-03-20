type PrismaModel = {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    findFirst: (...args: unknown[]) => Promise<unknown | null>;
    findUnique: (...args: unknown[]) => Promise<unknown | null>;
    create: (...args: unknown[]) => Promise<unknown>;
    update: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
    count: (...args: unknown[]) => Promise<number>;
};
type PrismaClientLike = {
    project: PrismaModel;
    task: PrismaModel;
    taskAssignment: PrismaModel;
    timeEntry: PrismaModel;
    user: PrismaModel;
};
export declare function getPrismaClient(): PrismaClientLike;
export {};
