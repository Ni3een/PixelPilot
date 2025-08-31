import { baseProcedure, createTRPCRouter } from "@/trpc/router/init";
import {z} from "zod"
import {prisma} from "@/lib/db"
import {inngest} from "@/inngest/client"
export const messagesRouter=createTRPCRouter({
    getMany:baseProcedure
    .query(async()=>{
        const messages=await prisma.message.findMany({
            orderBy:{
                updatedAt:"desc",
            },
        })
        return messages;
    }),
    create: baseProcedure
    .input(
        z.object({
            value:z.string().min(1,{message:"Message is required :"})
        }),
    )
    .mutation(async({input})=>{
        const createdMessages = await prisma.message.create({
            data:{
                content:input.value,
                role:"USER",
                type:"RESULT"
            }
        })

        await inngest.send({
            name:"code-Agent/run",
            data:{
                value:input.value,
            }
        })

        return createdMessages;
    })
});