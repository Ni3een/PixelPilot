import { getQueryClient, trpc } from "@/trpc/router/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react";
import { Client } from "./api/trpc/[trpc]/client";

// This component will show the loading state
function Loading() {
  return <p>Loading...</p>;
}

export default async function Page() {
  const queryClient = getQueryClient();
  
  // Prefetch the data
  await queryClient.prefetchQuery(trpc.CreateAI.queryOptions({ text: "World" }));
  const text = "World";
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Loading />}>
        <Client text={text} />
      </Suspense>
    </HydrationBoundary>
  )
}