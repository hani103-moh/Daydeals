import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Search, Calendar, ChevronRight, AlertCircle, RefreshCw, User, Clipboard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SentEmail {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  created_at: string;
}

const EmailsAdmin = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/emails', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load email history schema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmails = emails.filter((email) => {
    const query = searchTerm.toLowerCase();
    return (
      email.to_email.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Email <span className="text-primary">Ledger</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Simulated transactional audit log for mail notifications sent to clients.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchEmails} 
          disabled={loading}
          className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 border-white/5 bg-white/5 hover:bg-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Mailboxes List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search recipient, content, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/5 rounded-2xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-[2rem] border border-white/5 bg-white/5">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Streaming server registers...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-12 text-center rounded-[2rem] border border-white/5 bg-white/5 space-y-3">
              <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-sm uppercase">No Outbound Mail Found</p>
                <p className="text-xs text-muted-foreground">Any trigger actions will log outbound system emails here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 no-scrollbar">
              {filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <motion.div
                    key={email.id}
                    layoutId={`email-card-${email.id}`}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/15 shadow-lg shadow-primary/5' 
                        : 'border-white/5 hover:border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wide">
                          {email.subject.split(' ')[0] || 'Notification'}
                        </span>
                        <h3 className="font-extrabold text-sm line-clamp-1 mt-1 text-foreground leading-tight">
                          {email.subject}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                          <User className="w-3 h-3 text-primary" />
                          <span>{email.to_email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[8px] text-muted-foreground/45 mt-1 font-mono">
                          {new Date(email.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-black/10 px-3 py-2 rounded-xl border border-white/5 font-mono">
                      {email.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Email Details Visualizer */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedEmail ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/5 sticky top-28 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none">Simulation Client</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{selectedEmail.to_email}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white/5 text-muted-foreground"
                    onClick={() => handleCopy(selectedEmail.body, selectedEmail.id)}
                  >
                    {copiedId === selectedEmail.id ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Subject Line:</p>
                    <p className="font-extrabold text-base text-foreground leading-snug">{selectedEmail.subject}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Timestamp:</p>
                    <p className="text-xs font-mono text-muted-foreground/80">
                      {new Date(selectedEmail.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider mb-2">Email Body Output:</p>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono min-h-[160px] select-all max-h-[300px] overflow-y-auto no-scrollbar">
                      {selectedEmail.body}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/15 rounded-xl flex items-center gap-2.5 text-yellow-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-wider leading-none">
                    Mock Sandbox Mail Delivery — Logged successfully.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 rounded-[2rem] border-white/5 bg-white/5 text-center flex flex-col justify-center items-center h-80 sticky top-28 space-y-4">
                <Mail className="w-12 h-12 text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-wide">No Message Selected</p>
                  <p className="text-xs text-muted-foreground/75 max-w-[200px] mx-auto">
                    Select any simulated email notification from the ledger list to analyze its contents.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EmailsAdmin;
