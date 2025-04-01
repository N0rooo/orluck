import { Header } from "@/components/head/header"
import { createAppServerClient } from "@/supabase/server"
import React from "react"

export default async function layout({ children }: { children: React.ReactNode }) {
  const supabase = await createAppServerClient()
  const { data: { user } } = await supabase.auth.getUser()

	return (
		<div className="relative min-h-screen flex flex-col">
			<Header user={user} />
			<section className="flex-1">{children}</section>
		</div>
	)
}
