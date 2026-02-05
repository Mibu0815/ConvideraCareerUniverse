'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const C = {
  blue: "#0055FF",
  blueGlow: "rgba(0,85,255,0.4)",
  dark: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#E2E8F0",
  white70: "rgba(255,255,255,0.7)",
  white20: "rgba(255,255,255,0.2)",
};

const gridSvg = 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'rgba(0,85,255,0.05)\' stroke-width=\'1\'/%3E%3C/svg%3E")';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/onboarding';

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (authError) throw authError;
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(32px)',
    transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) ' + (i * 0.1 + 0.06) + 's',
  });

  return (
    <>
      <style>{String.raw`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.9)}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-40px,30px) scale(1.12)}66%{transform:translate(25px,-40px) scale(0.88)}}
        @keyframes btnGlow{0%,100%{box-shadow:0 4px 18px rgba(0,85,255,0.15)}50%{box-shadow:0 4px 40px rgba(0,85,255,0.4)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .register-btn{transition:all .3s ease}
        .register-btn:hover:not(:disabled){box-shadow:0 0 24px rgba(0,85,255,0.5),0 4px 14px rgba(0,0,0,.2)!important;transform:translateY(-2px)}
        .register-btn:disabled{opacity:0.7;cursor:not-allowed}
        .input-field{transition:all .2s ease}
        .input-field:focus{outline:none;border-color:#0055FF;box-shadow:0 0 0 4px rgba(0,85,255,.12)}
      `}</style>

      <div style={{
        fontFamily: "'Outfit',sans-serif",
        minHeight: '100vh',
        background: '#F8FAFC',
        backgroundImage: gridSvg,
        backgroundRepeat: 'repeat',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-15%',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,85,255,0.22) 0%, rgba(0,85,255,0.05) 45%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blob1 7s infinite',
          pointerEvents: 'none', zIndex: 0,
        }}/>
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,85,255,0.18) 0%, rgba(0,85,255,0.03) 45%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob2 7s infinite',
          pointerEvents: 'none', zIndex: 0,
        }}/>

        <div style={{
          ...anim(0),
          background: C.white70,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid ' + C.white20,
          borderRadius: '28px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            ...anim(1),
            width: '52px', height: '52px', borderRadius: '16px',
            background: C.dark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '22px', fontWeight: 700,
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,.16)',
          }}>c</div>

          <h1 style={{
            ...anim(2),
            fontSize: '32px', fontWeight: 800, lineHeight: 1.15,
            color: C.dark, letterSpacing: '-1.5px', marginBottom: '12px',
          }}>
            Starte deine<br/>Karriere-Reise
          </h1>
          <p style={{ ...anim(3), fontSize: '15px', color: C.textMuted, lineHeight: 1.6, marginBottom: '36px' }}>
            Erstelle deinen Account und entdecke deinen personalisierten Lernpfad.
          </p>

          <form onSubmit={handleRegister}>
            <div style={{ ...anim(4), marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textFaint, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color={C.textFaint} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                  className="input-field"
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px',
                    borderRadius: '14px', border: '1.5px solid ' + C.border,
                    fontSize: '15px', fontWeight: 500, color: C.dark,
                    background: 'rgba(255,255,255,.9)',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                />
              </div>
            </div>

            <div style={{ ...anim(5), marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textFaint, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                E-Mail Adresse
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color={C.textFaint} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@convidera.com"
                  required
                  className="input-field"
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px',
                    borderRadius: '14px', border: '1.5px solid ' + C.border,
                    fontSize: '15px', fontWeight: 500, color: C.dark,
                    background: 'rgba(255,255,255,.9)',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                />
              </div>
            </div>

            <div style={{ ...anim(6), marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: C.textFaint, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                Passwort
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color={C.textFaint} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                  className="input-field"
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px',
                    borderRadius: '14px', border: '1.5px solid ' + C.border,
                    fontSize: '15px', fontWeight: 500, color: C.dark,
                    background: 'rgba(255,255,255,.9)',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#DC2626' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading || !email || !password || !name} className="register-btn" style={{
              ...anim(7),
              width: '100%', padding: '16px 24px',
              borderRadius: '14px', border: 'none',
              background: C.dark, color: '#fff',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              animation: email && password && name && !isLoading ? 'btnGlow 3s infinite' : 'none',
              fontFamily: "'Outfit',sans-serif",
            }}>
              {isLoading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> Konto erstellen...</>
              ) : (
                <><Sparkles size={18}/> Konto erstellen</>
              )}
            </button>
          </form>

          <p style={{ ...anim(8), marginTop: '24px', textAlign: 'center', fontSize: '14px', color: C.textMuted }}>
            Bereits registriert?{' '}
            <Link href="/auth/login" style={{ color: C.dark, fontWeight: 600, textDecoration: 'none' }}>
              Anmelden
            </Link>
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: C.textFaint }}>Convidera GmbH - Career Universe 2.0</p>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} className="animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
