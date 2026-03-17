export default function SignupPage() {
    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,106,0,0.45),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(207,175,99,0.4),transparent_55%),#141414]" />
            </div>
            <div className="flex items-center justify-center bg-[#0B0B0B] p-6">
                <form className="glass-card w-full max-w-md rounded-3xl border border-[#CFAF63]/25 p-7">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Join Us</p>
                    <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Create Account</h1>
                    <div className="mt-6 space-y-4">
                        <input type="text" placeholder="Full Name" className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3" />
                        <input type="email" placeholder="Email" className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3" />
                        <input type="tel" placeholder="Phone" className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3" />
                        <input type="password" placeholder="Password" className="w-full rounded-xl border border-[#CFAF63]/25 bg-[#121212] px-4 py-3" />
                        <button className="w-full rounded-full bg-gradient-to-r from-[#CFAF63] to-[#FF6A00] px-4 py-3 font-semibold text-[#111]">Create Account</button>
                    </div>
                    <p className="mt-4 text-center text-sm text-[#F5F5F5]/70">
                        Already have an account?{" "}
                        <a href="/login" className="text-[#CFAF63] hover:text-[#FF6A00]">
                            Sign In
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
