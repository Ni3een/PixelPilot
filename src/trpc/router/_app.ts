import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '@/trpc/router/init'
export const appRouter = createTRPCRouter({
  CreateAI: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: opts.input.text,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;