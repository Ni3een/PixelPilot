"use client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/router/client"

interface ClientProps {
    text: string;
}

export function Client({ text }: ClientProps) {
    const trpc = useTRPC()
    const { data, isLoading } = useSuspenseQuery(trpc.CreateAI.queryOptions({ text }))
    
    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {data?.greeting || 'No greeting found'}
            </h1>
        </div>
    )
}