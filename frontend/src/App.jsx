import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';

const API_BASE = "http://localhost:8000";

/* ─────────────────────────────────────────
   Liquid-glass style injected once
───────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Instrument+Serif:ital@0;1&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #000;
      color: #fff;
      font-family: 'Almarai', sans-serif;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: #222 #000;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

    .liquid-glass {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: relative;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    }
    .liquid-glass::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1.4px;
      border-radius: inherit;
      background: linear-gradient(to bottom,
        rgba(255,255,255,0.35) 0%,
        transparent 40%,
        transparent 60%,
        rgba(255,255,255,0.35) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    .italic-em {
      font-family: 'Instrument Serif', serif;
      font-style: italic;
    }

    @keyframes pullUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-pull-up { animation: pullUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    .liquid-input {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .liquid-input:focus {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(222, 219, 200, 0.4);
      outline: none;
      box-shadow: 0 0 0 4px rgba(222, 219, 200, 0.05);
    }
    .prisma-reveal {
      overflow: hidden;
      position: relative;
      display: inline-block;
    }
    .reveal-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(222, 219, 200, 0.5), transparent);
      width: 0;
      margin: 0 auto;
      animation: expandLine 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
    }
    @keyframes expandLine {
      to { width: 100%; }
    }
    .fade-in-up {
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }

    .reveal-on-scroll { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
    .reveal-on-scroll.visible { opacity: 1; transform: translateY(0); }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
      display: inline-block; line-height: 1;
    }

    video { object-fit: cover; width: 100%; height: 100%; }

    input { outline: none; }
    input::placeholder { color: rgba(255,255,255,0.35); }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `}</style>
);

export default function App() {
  const [documents, setDocuments]   = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput]           = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping]     = useState(false);
  const [email, setEmail]           = useState('');
  const endRef = useRef(null);

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  /* Scroll-reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchDocuments();
    } else {
      localStorage.removeItem('token');
      setDocuments([]);
      setChatHistory([]);
    }
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        const fd = new URLSearchParams();
        fd.append('username', authEmail);
        fd.append('password', authPassword);
        const res = await axios.post(`${API_BASE}/auth/token`, fd, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        setToken(res.data.access_token);
        setAuthModalOpen(false);
      } else {
        await axios.post(`${API_BASE}/auth/register`, { email: authEmail, password: authPassword });
        setIsLogin(true);
        setAuthError('Registration successful. Please login.');
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  const logout = () => {
    setToken(null);
  };
  useEffect(() => {
    if (chatHistory.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/documents`, { headers: { Authorization: `Bearer ${token}` }});
      setDocuments(res.data.documents || []);
    } catch (e) { console.error(e); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      setIsUploading(true);
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        try { await axios.post(`${API_BASE}/upload`, fd, { headers: { Authorization: `Bearer ${token}` }}); } catch (e) { console.error(e); }
      }
      setIsUploading(false);
      setTimeout(fetchDocuments, 2000);
    }
  });

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_BASE}/documents/${id}`, { headers: { Authorization: `Bearer ${token}` }}); fetchDocuments(); } catch (e) { console.error(e); }
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;
    const userMsg = { role: 'user', content: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: input })
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let bot = { role: 'bot', content: '', sources: [] };
      setChatHistory(prev => [...prev, bot]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'chunk') {
              bot.content += data.content;
              setChatHistory(prev => { const h = [...prev]; h[h.length - 1] = { ...bot }; return h; });
            } else if (data.type === 'sources') {
              bot.sources = data.content;
              setChatHistory(prev => { const h = [...prev]; h[h.length - 1] = { ...bot }; return h; });
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', content: 'An error occurred.' }]);
    } finally { setIsTyping(false); }
  };

  return (
    <>
      <GlobalStyle />

      {/* Auth Modal */}
      {authModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
          <div className="liquid-glass fade-in-up" style={{ width: '90%', maxWidth: '440px', borderRadius: '1.5rem', padding: '3.5rem 2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => setAuthModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5 }}>
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 className="prisma-reveal" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3rem', fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                {isLogin ? 'Welcome Back' : 'Join the Collective'}
              </h2>
              <div className="reveal-line"></div>
              {!isLogin && (
                <p className="fade-in-up" style={{ animationDelay: '0.2s', fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                  Entry into the NOVASYNC creative ecosystem.
                </p>
              )}
            </div>

            {authError && <p className="fade-in-up" style={{ color: '#ffb4ab', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>{authError}</p>}
            
            <form onSubmit={handleAuth} className="fade-in-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', animationDelay: '0.4s' }}>
              
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginLeft: '0.25rem' }}>Full Name</label>
                  <input className="liquid-input" type="text" placeholder="ALEXANDER VANCE" style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontFamily: 'Almarai, sans-serif' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginLeft: '0.25rem' }}>Email Address</label>
                <input className="liquid-input" type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={isLogin ? "name@studio.com" : "CONNECT@STUDIO.COM"} style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontFamily: 'Almarai, sans-serif' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Password</label>
                  {isLogin && <a href="#" style={{ fontSize: '0.75rem', color: 'rgba(251,247,228,0.6)', textDecoration: 'none' }}>Forgot Password?</a>}
                </div>
                <input className="liquid-input" type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontFamily: 'Almarai, sans-serif' }} />
              </div>
              
              <div style={{ paddingTop: '1rem' }}>
                <button type="submit" style={{ width: '100%', padding: '1.25rem', borderRadius: '9999px', background: '#dedbc8', color: '#323124', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} onMouseDown={e => e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform='scale(1.02)'}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
            
            <div className="fade-in-up" style={{ marginTop: '3rem', width: '100%', textAlign: 'center', animationDelay: '0.6s' }}>
              <p style={{ fontSize: '1rem', color: '#bab8b7' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => { setIsLogin(!isLogin); setAuthError(''); }} style={{ color: '#fbf7e4', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'rgba(251,247,228,0.3)', marginLeft: '0.5rem' }}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </span>
              </p>
              {!isLogin && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(201,198,188,0.4)', marginTop: '1rem', lineHeight: 1.6, maxWidth: '280px', margin: '1rem auto 0' }}>
                  By signing up, you agree to our Terms of Service and Privacy Policy. All artistic assets are protected.
                </p>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <header style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '960px', zIndex: 50 }}>
        <nav className="liquid-glass" style={{ borderRadius: '9999px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontVariationSettings: "'FILL' 1" }}>neurology</span>
            <span style={{ fontWeight: 800, letterSpacing: '-0.04em', fontSize: '1.1rem' }}>NOVASYNC</span>
          </div>
          {/* Links */}
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>Features</a>
            <a href="#dashboard" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>Dashboard</a>
            <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>About</a>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {!token ? (
              <>
                <button onClick={() => { setIsLogin(false); setAuthModalOpen(true); }} style={{ background: 'none', border: 'none', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Sign Up</button>
                <button onClick={() => { setIsLogin(true); setAuthModalOpen(true); }} className="liquid-glass" style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', color: '#fff', cursor: 'pointer' }}>Login</button>
              </>
            ) : (
              <button onClick={logout} className="liquid-glass" style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', color: '#fff', cursor: 'pointer' }}>Logout</button>
            )}
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Video BG */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4" type="video/mp4" />
          </video>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        </div>

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '900px', marginTop: '5rem' }}>
          <h1 className="animate-pull-up" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(3.5rem, 10vw, 7rem)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400 }}>
            Know it then <span className="italic-em">*all*</span>
          </h1>

          {/* Email pill */}
          <div className="animate-pull-up liquid-glass" style={{ animationDelay: '0.2s', opacity: 0, width: '100%', maxWidth: '420px', borderRadius: '9999px', display: 'flex', alignItems: 'center', padding: '0.25rem 0.25rem 0.25rem 1.5rem' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, fontFamily: 'Almarai, sans-serif', fontSize: '0.9rem' }}
            />
            <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '9999px', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'transform 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_right_alt</span>
            </button>
          </div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', animationDelay: '0.25s' }}>Become part of the collective</p>

          {/* CTA */}
          <div className="animate-pull-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <a href="#dashboard" className="liquid-glass" style={{ borderRadius: '9999px', padding: '1rem 3rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'inline-block', textDecoration: 'none', color: '#fff', transition: 'background 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
              Explore Platform
            </a>
          </div>
        </div>

        {/* Bottom social pills */}
        <div style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', zIndex: 10 }}>
          {['share','public','mail'].map(icon => (
            <button key={icon} className="liquid-glass" style={{ width: '3rem', height: '3rem', borderRadius: '9999px', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{icon}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: '8rem 2rem', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="reveal-on-scroll" style={{ maxWidth: '900px' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '2rem' }}>About Us</span>
          <h2 style={{ fontFamily: 'Almarai, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, lineHeight: 1.2 }}>
            Pioneering ideas for minds that{' '}
            <span className="italic-em" style={{ color: 'rgba(255,255,255,0.8)' }}>create</span>,{' '}
            <span className="italic-em" style={{ color: 'rgba(255,255,255,0.8)' }}>build</span>, and{' '}
            <span className="italic-em" style={{ color: 'rgba(255,255,255,0.8)' }}>inspire</span>.
          </h2>
        </div>
      </section>

      {/* ── FEATURED VIDEO ── */}
      <section style={{ padding: '0 2rem 8rem' }}>
        <div className="reveal-on-scroll" style={{ maxWidth: '1280px', margin: '0 auto', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
          <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4" type="video/mp4" />
          </video>
          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }}>
            <div className="liquid-glass" style={{ borderRadius: '1.25rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(1.2rem, 2.5vw, 2rem)' }}>Our Approach</span>
              <button className="liquid-glass" style={{ borderRadius: '9999px', padding: '0.75rem 2rem', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', color: '#fff', cursor: 'pointer' }}>Explore More</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '8rem 2rem', background: '#000' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { num: '01', icon: 'upload_file',   title: 'Document Ingestion',   desc: 'Upload PDF, DOCX, TXT. Semantic chunking with SHA-256 dedup for blazing-fast incremental indexing.',    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4' },
            { num: '02', icon: 'manage_search', title: 'Hybrid Retrieval',     desc: 'Combines ChromaDB semantic search with BM25 keyword search, reranked by a Cross-Encoder for precision.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4' },
            { num: '03', icon: 'forum',         title: 'Streaming AI Chat',    desc: 'Real-time answers powered by Groq / Llama 3.3 70B. Ask questions, get verifiable answers with citations.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4' },
          ].map(({ num, title, desc, video }, i) => (
            <div key={i} className="liquid-glass reveal-on-scroll" style={{ borderRadius: '2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', transitionDelay: `${i * 0.1}s` }}>
              <div style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1s ease' }}
                  onMouseEnter={e=>e.target.style.transform='scale(1.05)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                  <source src={video} type="video/mp4" />
                </video>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
              </div>
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem' }}>{num}</span>
                  <h3 style={{ fontFamily: 'Almarai, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontSize: '0.9rem' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD ── */}
      <section id="dashboard" style={{ padding: '8rem 2rem', background: '#000' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="reveal-on-scroll" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.75rem' }}>Workspace</span>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 400 }}>Intelligence Hub</h2>
            </div>
            <p style={{ maxWidth: '280px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontSize: '0.85rem' }}>
              Upload your documents, then chat with them in real time using AI-powered hybrid retrieval.
            </p>
          </div>

          {/* UPLOAD BAR */}
          {!token ? (
            <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '1.5rem', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.4)' }}>lock</span>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Authentication Required</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Please login or sign up to access your personal RAG workspace.</p>
              </div>
              <button onClick={() => { setIsLogin(true); setAuthModalOpen(true); }} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '9999px', padding: '0.75rem 2rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Login to Workspace</button>
            </div>
          ) : (
            <>
              <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '1.5rem', marginBottom: '1.5rem' }}>
                <div {...getRootProps()} style={{ width: '100%', border: `2px dashed ${isDragActive ? '#fff' : 'rgba(255,255,255,0.15)'}`, borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s', background: isDragActive ? 'rgba(255,255,255,0.04)' : 'transparent', padding: '1.5rem 2.5rem' }}>
                  <input {...getInputProps()} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: isDragActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>upload_file</span>
                    <div>
                      <p style={{ fontSize: '1.1rem', fontWeight: 400, color: isDragActive ? '#fff' : 'rgba(255,255,255,0.8)', margin: 0, marginBottom: '0.2rem' }}>Ready for Ingestion</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', margin: 0 }}>DROP PDF, DOCX, TXT, OR MD FILES HERE</p>
                    </div>
                  </div>
                  {isUploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                      <span className="material-symbols-outlined spin" style={{ fontSize: '0.9rem' }}>refresh</span> Indexing…
                    </div>
                  )}
                </div>
              </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', height: '560px' }}>

            {/* CHAT HISTORY */}
            <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '2rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', transitionDelay: '0.1s', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>history</span>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Chat History</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <p style={{ fontSize: '0.82rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Current Session</p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>Just now</p>
                </div>
                {/* Mocked previous history item */}
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Research analysis</p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>Yesterday</p>
                </div>
              </div>
            </div>

            {/* CHAT */}
            <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '2rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', transitionDelay: '0.2s', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <span style={{ width: '0.6rem', height: '0.6rem', borderRadius: '9999px', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Chat active</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', minHeight: 0 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', opacity: 0.4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>forum</span>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>Ask anything about your documents</p>
                  </div>
                ) : chatHistory.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '0.6rem 0.9rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.82rem', lineHeight: 1.6, wordBreak: 'break-words',
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderTopRightRadius: msg.role === 'user' ? 0 : '0.75rem',
                      borderTopLeftRadius:  msg.role === 'bot'  ? 0 : '0.75rem',
                    }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.4rem' }}>
                        {msg.sources.map((s, idx) => (
                          <span key={idx} style={{ padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.65rem' }}>description</span> {s.file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: '0.75rem', borderTopLeftRadius: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', width: 'fit-content' }}>
                    <span className="material-symbols-outlined spin" style={{ fontSize: '0.9rem' }}>refresh</span> Processing…
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div style={{ flexShrink: 0, position: 'relative' }}>
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything…"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.85rem 3rem 0.85rem 1rem', color: '#fff', fontSize: '0.82rem', fontFamily: 'Almarai, sans-serif', boxSizing: 'border-box' }}
                />
                <button onClick={handleSend} disabled={!input.trim() || isTyping} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: input.trim() ? '#fff' : 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>

            {/* LIBRARY */}
            <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '2rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', transitionDelay: '0.3s', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                <h3 style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Library ({documents.length})</h3>
                <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem', cursor: 'pointer' }}>filter_list</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {documents.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4, gap: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>folder_open</span>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>No documents yet</p>
                  </div>
                ) : documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', marginBottom: '0.4rem', transition: 'background 0.2s', border: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                    <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
                      {doc.type === '.pdf' ? 'picture_as_pdf' : doc.type === '.txt' ? 'description' : 'article'}
                    </span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</p>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0.2rem 0 0' }}>{doc.type} · Synced</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(doc.id); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', opacity: 0.7, padding: '0.2rem', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#000' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
              <span style={{ fontWeight: 800, letterSpacing: '-0.04em', fontSize: '1.1rem' }}>NOVASYNC</span>
            </div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>© 2024 NOVASYNC. ALL RIGHTS RESERVED.</p>
          </div>
          <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            {['Privacy', 'Terms', 'Instagram', 'Twitter'].map(item => (
              <a key={item} href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.35)'}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
