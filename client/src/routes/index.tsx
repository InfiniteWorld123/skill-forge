import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { AppType } from '../../../server/src/routes/auth.route'
import { hc } from 'hono/client'

const client = hc<AppType>('http://localhost:8000/')

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [result, setResult] = useState<string | null>(null)

  const testRpc = async () => {
    const res = await client['sign-up'].$post()
    const data = await res.json()
    setResult(data.hello)
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <button
        type="button"
        onClick={testRpc}
        className="mt-4 rounded bg-black px-4 py-2 text-white"
      >
        Test RPC
      </button>
      {result !== null && <p className="mt-2">Response: {JSON.stringify(result)}</p>}
    </div>
  )
}
