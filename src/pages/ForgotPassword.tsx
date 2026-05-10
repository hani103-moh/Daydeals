import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetLink(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        if (data.resetLink) {
          setResetLink(data.resetLink);
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 glass p-8 rounded-3xl border border-white/10"
      >
        <div className="text-center space-y-2">
          <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-4">Forgot Password?</h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {message ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{message}</p>
            </div>
            
            {resetLink && (
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demo: Direct Reset Link</p>
                <Button asChild className="w-full rounded-xl">
                  <Link to={resetLink}>Reset Password Now</Link>
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">In a production app, this would be sent via email.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="pl-10 h-12 rounded-xl transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium ml-1">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-medium shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
