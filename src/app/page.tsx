"use client"
import {toast} from "sonner"
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/router/client";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {useState} from "react"

const Page = () => {
  const [value, setValue] = useState("");
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess:()=>{
      toast.success("background job is started")
    }
  }))

  
  return (
    <div className="p-4 max-w-7xl mx-auto">
    <Input value={value} onChange={(e)=>setValue(e.target.value)}></Input>
    <Button disabled={invoke.isPending} onClick={() => invoke.mutate({text:value,value:value })}>Invoke</Button>
    Invoke Background Job
    </div>
  )
}
export default Page;