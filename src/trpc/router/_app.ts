import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '@/trpc/router/init'
import { inngest } from '@/inngest/client';
export const appRouter = createTRPCRouter({
  invoke:baseProcedure
  .input(
    z.object({
      text:z.string(),
      value:z.string(),
    })
  )
  .mutation(async({input})=>{
    const result = await inngest.send({
      name:"test/hello.world",
      data:{
        email:input.text,
        value:input.value,
      }
    });
    return {
      output: `Generated content for: ${input.value}`,
      sandboxUrl: `https://sandbox.example.com/${Date.now()}` // This should be replaced with actual sandbox URL
    };
  }),
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