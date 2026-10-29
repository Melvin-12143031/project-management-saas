import { useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

import { toast } from 'sonner'

const AuthPage = () => {

    const navigate = useNavigate()

    const [mode, setMode] = useState('signin')
    const [showPassword, setShowPassword] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)


    const isSignUp = mode === 'signup'

    const handleSubmit = async (event) => {
        event.preventDefault()


        if (!email.trim() || !password) {
            toast.error('Please enter your email and password.')
            return
        }

        if (isSignUp && !name.trim()) {
            toast.error('Please enter your name.')
            return
        }

        setIsLoading(true)

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                })

                if (signUpError) {
                    throw signUpError
                }

                toast.success(
                    'Account created! Check your email to confirm your account.',
                )

                setName('')
                setEmail('')
                setPassword('')
            } else {
                const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                        email,
                        password,
                    })

                if (signInError) {
                    throw signInError
                }

                toast.success('Signed in successfully!')

                setEmail('')
                setPassword('')

                navigate('/dashboard')
            }
        } catch (err) {
            toast.error(err.message || 'Authentication failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="grid min-h-screen lg:grid-cols-[0.50fr_1.50fr]">
                {/* Brand panel */}
                <section className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-900 lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

                    <div className="relative p-10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                                <LockKeyhole size={20} />
                            </div>

                            <div>
                                <p className="font-bold tracking-tight">
                                    Flowspace
                                </p>
                                <p className="text-xs text-slate-500">
                                    Project workspace
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative max-w-xl p-10">
                        <p className="text-sm font-medium text-violet-400">
                            PROJECT MANAGEMENT, SIMPLIFIED
                        </p>

                        <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-white">
                            Turn ideas into
                            <span className="text-violet-400">
                                {' '}
                                organized work.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                            Manage projects, coordinate tasks, and keep your
                            entire team aligned in one focused workspace.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                'Organize projects and tasks',
                                'Track progress across your workspace',
                                'Collaborate with your team',
                            ].map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3 text-sm text-slate-300"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                        <Check size={14} />
                                    </div>

                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative p-10 text-xs text-slate-600">
                        © 2026 Flowspace
                    </div>
                </section>

                {/* Auth panel */}
                <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
                    <div className="w-full max-w-lg">
                        {/* Mobile brand */}
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                                <LockKeyhole size={20} />
                            </div>

                            <div>
                                <p className="font-bold tracking-tight">
                                    Flowspace
                                </p>
                                <p className="text-xs text-slate-500">
                                    Project workspace
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-violet-400">
                                {isSignUp
                                    ? 'GET STARTED'
                                    : 'WELCOME BACK'}
                            </p>

                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                                {isSignUp
                                    ? 'Create your account'
                                    : 'Sign in to Flowspace'}
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-400">
                                {isSignUp
                                    ? 'Create your workspace account and start organizing your work.'
                                    : 'Enter your credentials to continue to your workspace.'}
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 space-y-5"
                        >
                            {isSignUp && (
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Full name
                                    </label>

                                    <div className="relative">
                                        <UserRound
                                            size={17}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                                        />

                                        <input
                                            id="name"
                                            type="text"
                                            placeholder="Your name"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="auth-email"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Email address
                                </label>

                                <div className="relative">
                                    <Mail
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                                    />

                                    <input
                                        id="auth-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="auth-password"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <LockKeyhole
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                                    />

                                    <input
                                        id="auth-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-12 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current,
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {!isSignUp && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading
                                    ? isSignUp
                                        ? 'Creating account...'
                                        : 'Signing in...'
                                    : isSignUp
                                        ? 'Create account'
                                        : 'Sign in'}

                                <ArrowRight size={17} />
                            </button>
                        </form>

                        {/* Mode switch */}
                        <div className="mt-8 text-center text-sm text-slate-500">
                            {isSignUp
                                ? 'Already have an account?'
                                : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() =>
                                    setMode(
                                        isSignUp
                                            ? 'signin'
                                            : 'signup',
                                    )
                                }
                                className="font-medium text-violet-400 transition hover:text-violet-300"
                            >
                                {isSignUp
                                    ? 'Sign in'
                                    : 'Create an account'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default AuthPage