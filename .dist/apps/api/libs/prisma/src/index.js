const createNoopModel = () => ({
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
});
const prismaStub = {
    project: createNoopModel(),
    task: createNoopModel(),
    taskAssignment: createNoopModel(),
    timeEntry: createNoopModel(),
    user: createNoopModel(),
};
let prismaClient;
export function getPrismaClient() {
    if (!prismaClient) {
        prismaClient = prismaStub;
    }
    return prismaClient;
}
