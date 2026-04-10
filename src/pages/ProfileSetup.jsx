import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function ProfileSetup() {
    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [upiId, setUpiId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!name.trim()) {
            setError("Enter your name or business name.")
            return
        }

        if (!upiId.trim()) {
            setError("Enter your UPI ID.")
            return
        }

        try {
            setLoading(true)
            setError("")

            const {
                data: { user },
            } = await supabase.auth.getUser()

            const { error } = await supabase
                .from("profiles")
                .update({
                    name,
                    upi_id: upiId,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

            if (error) throw error

            navigate("/dashboard")
        } catch (err) {
            console.error(err)
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[--bg-base] text-[--text-primary]">
            <div className="w-full max-w-md border border-[--border-default] p-6 rounded-2xl bg-[--bg-surface]">
                <p className="text-xs uppercase tracking-widest text-[--text-secondary] mb-2">
                    One-time setup
                </p>

                <h1 className="text-2xl font-semibold mb-2">
                    Set up your profile
                </h1>

                <p className="text-sm text-[--text-secondary] mb-6">
                    This fills in every invoice automatically. You'll only do this once.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
                            YOUR NAME OR BUSINESS NAME
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-[--text-secondary]">
                            YOUR UPI ID
                        </label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full mt-1 p-3 bg-[--bg-base] border border-[--border-default] rounded-xl"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-[--danger]">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[--accent] text-[#0C0A09]"
                    >
                        {loading ? "Saving..." : "Save and continue"}
                    </button>
                </form>
            </div>
        </div>
    )
}