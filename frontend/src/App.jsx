import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';
import { useGoogleLogin } from '@react-oauth/google';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Global axios interceptor for handling 401s
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────
   Liquid-glass style injected once
───────────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Instrument+Serif:ital@0;1&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Global Site Themes ─────────────────────────────────────────── */
    body.site-theme-void {
      --site-bg: #000000;
      --site-bg2: #0a0a0a;
      --site-fg: #ffffff;
      --site-fg2: rgba(255,255,255,0.6);
      --site-accent: rgba(255,255,255,0.12);
      --site-border: rgba(255,255,255,0.08);
      --site-scrollbar: #333;
      background: #000; color: #fff;
      scrollbar-color: #333 #000;
    }
    body.site-theme-pearl {
      --site-bg: #f5f3ef;
      --site-bg2: #eceae4;
      --site-fg: #1a1a1a;
      --site-fg2: rgba(0,0,0,0.55);
      --site-accent: rgba(0,0,0,0.07);
      --site-border: rgba(0,0,0,0.1);
      --site-scrollbar: #bbb;
      background: #f5f3ef; color: #1a1a1a;
      scrollbar-color: #bbb #f5f3ef;
    }
    body.site-theme-pearl .liquid-glass {
      background: rgba(0,0,0,0.04);
      box-shadow: inset 0 1px 1px rgba(0,0,0,0.08);
    }
    body.site-theme-pearl .liquid-glass::before {
      background: linear-gradient(to bottom,rgba(0,0,0,0.12) 0%,transparent 40%,transparent 60%,rgba(0,0,0,0.12) 100%);
    }
    body.site-theme-pearl input::placeholder { color: rgba(0,0,0,0.3); }
    body.site-theme-pearl .liquid-input {
      background: rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.12);
    }
    body.site-theme-pearl .liquid-input:focus {
      background: rgba(0,0,0,0.06);
      border-color: rgba(0,0,0,0.3);
      box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
    }

    /* Pearl: force all text dark, overriding inline white colors */
    /* Pearl: force text dark, but EXCLUDE chat, modals, and liquid-glass buttons */
    body.site-theme-pearl section:not(:first-of-type) h1,
    body.site-theme-pearl section:not(:first-of-type) h2,
    body.site-theme-pearl section:not(:first-of-type) h3,
    body.site-theme-pearl section:not(:first-of-type) p,
    body.site-theme-pearl section:not(:first-of-type) span:not(.material-symbols-outlined):not(.chat-typing) { color: #1a1a1a !important; }
    
    body.site-theme-pearl section:not(:first-of-type) .material-symbols-outlined:not(.chat-empty-icon) { color: #1a1a1a !important; }
    
    body.site-theme-pearl nav span:not(.material-symbols-outlined),
    body.site-theme-pearl nav a,
    body.site-theme-pearl nav button,
    body.site-theme-pearl nav .material-symbols-outlined { color: #ffffff !important; }
    
    body.site-theme-pearl footer a,
    body.site-theme-pearl footer p,
    body.site-theme-pearl footer span { color: rgba(0,0,0,0.5) !important; }
    body.site-theme-pearl footer .material-symbols-outlined { color: #1a1a1a !important; }


    body.site-theme-sakura {
      --site-bg: #1a0a10;
      --site-bg2: #210d14;
      --site-fg: #ffe4ec;
      --site-fg2: rgba(255,200,215,0.65);
      --site-accent: rgba(255,100,150,0.1);
      --site-border: rgba(255,100,150,0.15);
      --site-scrollbar: #7a3350;
      background: #1a0a10; color: #ffe4ec;
      scrollbar-color: #7a3350 #1a0a10;
    }
    body.site-theme-sakura .liquid-glass {
      background: rgba(255,100,150,0.05);
      box-shadow: inset 0 1px 1px rgba(255,150,180,0.15);
    }
    body.site-theme-sakura .liquid-glass::before {
      background: linear-gradient(to bottom,rgba(255,150,180,0.3) 0%,transparent 40%,transparent 60%,rgba(255,150,180,0.3) 100%);
    }
    body.site-theme-sakura .reveal-line {
      background: linear-gradient(90deg, transparent, rgba(255,150,180,0.5), transparent);
    }
    body.site-theme-ocean {
      --site-bg: #e8f4fd;
      --site-bg2: #d0e8f7;
      --site-fg: #0a2540;
      --site-fg2: rgba(10,37,64,0.6);
      --site-accent: rgba(14,165,233,0.12);
      --site-border: rgba(14,165,233,0.2);
      --site-scrollbar: #7ec8e3;
      background: #e8f4fd; color: #0a2540;
      scrollbar-color: #7ec8e3 #e8f4fd;
    }
    body.site-theme-ocean .liquid-glass {
      background: rgba(14,165,233,0.08);
      box-shadow: inset 0 1px 1px rgba(14,165,233,0.2);
    }
    body.site-theme-ocean .liquid-glass::before {
      background: linear-gradient(to bottom,rgba(14,165,233,0.3) 0%,transparent 40%,transparent 60%,rgba(14,165,233,0.3) 100%);
    }
    body.site-theme-ocean .reveal-line {
      background: linear-gradient(90deg, transparent, rgba(14,165,233,0.6), transparent);
    }
    /* Ocean: dark text on light sky background, EXCLUDE chat, modals, and liquid-glass */
    body.site-theme-ocean section:not(:first-of-type) h1,
    body.site-theme-ocean section:not(:first-of-type) h2,
    body.site-theme-ocean section:not(:first-of-type) h3,
    body.site-theme-ocean section:not(:first-of-type) p,
    body.site-theme-ocean section:not(:first-of-type) span:not(.material-symbols-outlined):not(.chat-typing) { color: #0a2540 !important; }
    
    body.site-theme-ocean section:not(:first-of-type) .material-symbols-outlined:not(.chat-empty-icon) { color: #0e6ea8 !important; }
    
    body.site-theme-ocean nav span:not(.material-symbols-outlined),
    body.site-theme-ocean nav a,
    body.site-theme-ocean nav button,
    body.site-theme-ocean nav .material-symbols-outlined { color: #ffffff !important; }
    
    body.site-theme-ocean footer a,
    body.site-theme-ocean footer p,
    body.site-theme-ocean footer span { color: rgba(10,37,64,0.5) !important; }

    body {
      font-family: 'Almarai', sans-serif;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--site-bg, #000); }
    ::-webkit-scrollbar-thumb { background: var(--site-scrollbar, #333); border-radius: 2px; }


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

    /* Responsive Styles */
    .nav-links { display: flex; gap: 2rem; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
    .about-section { padding: 8rem 2rem; }
    .dashboard-section { padding: 8rem 2rem; }
    .hub-grid { display: grid; grid-template-columns: repeat(3, 1fr); height: 560px; }

    @media (max-width: 900px) {
      .hub-grid { grid-template-columns: 1fr; height: auto; gap: 2rem !important; }
      .hub-grid > div { height: 500px; min-height: auto; }
      header { top: 1rem !important; width: 95% !important; }
      .nav-links { display: none; }
      .about-section, .dashboard-section { padding: 4rem 1.5rem; }
    }

    /* ── Chat Themes ─────────────────────────────────────────────────── */

    /* Theme: Black */
    .chat-theme-black { background: #0a0a0a !important; border-radius: 2rem; }
    .chat-theme-black .chat-msg-user, .chat-theme-black .chat-msg-user p {
      background: #1a1a1a;
      border: none;
      border-radius: 1.25rem !important;
      color: #ececec !important;
    }
    .chat-theme-black .chat-msg-bot, .chat-theme-black .chat-msg-bot p {
      background: transparent;
      border: none;
      border-radius: 0 !important;
      color: #ececec !important;
      padding-left: 0;
    }
    .chat-theme-black .chat-input-box {
      background: #1a1a1a;
      border: 1px solid #333;
      color: #ececec;
      border-radius: 1rem;
    }
    .chat-theme-black .chat-typing {
      background: transparent;
      border: none;
      color: #888;
    }

    /* Theme: White */
    .chat-theme-white { background: #ffffff !important; border-radius: 2rem; }
    .chat-theme-white .chat-msg-user {
      background: #f4f4f4;
      border: none;
      border-radius: 1.25rem !important;
      color: #1a1a1a;
    }
    .chat-theme-white .chat-msg-bot {
      background: transparent;
      border: none;
      border-radius: 0 !important;
      color: #1a1a1a;
      padding-left: 0;
    }
    .chat-theme-white .chat-input-box {
      background: #f4f4f4;
      border: 1px solid #ddd;
      color: #1a1a1a;
      border-radius: 1rem;
    }
    .chat-theme-white .chat-typing {
      background: transparent;
      border: none;
      color: #888;
    }
    .chat-theme-white .chat-header-label { color: #555 !important; }
    .chat-theme-white .chat-send-btn { color: #333 !important; }
    .chat-theme-white .chat-send-btn:disabled { color: #bbb !important; }
    .chat-theme-white .source-chip {
      background: #f0f0f0 !important;
      border-color: #ddd !important;
      color: #555 !important;
    }
    .chat-theme-white .chat-empty-icon { color: #aaa !important; }

    /* Theme: Terminal */
    .chat-theme-terminal { background: #0d0d0d !important; border-radius: 2rem; font-family: 'Courier New', monospace !important; }
    .chat-theme-terminal .chat-msg-user, .chat-theme-terminal .chat-msg-user p {
      background: transparent;
      border: 1px solid #00ff41;
      border-radius: 4px !important;
      color: #00ff41 !important;
    }
    .chat-theme-terminal .chat-msg-bot, .chat-theme-terminal .chat-msg-bot p {
      background: transparent;
      border: none;
      border-radius: 0 !important;
      color: #00e535 !important;
      padding-left: 0;
    }
    .chat-theme-terminal .chat-msg-bot::before { content: '> '; opacity: 0.5; }
    .chat-theme-terminal .chat-input-box {
      background: #111;
      border: 1px solid #00ff41;
      color: #00ff41;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    .chat-theme-terminal .chat-input-box::placeholder { color: #00803e; }
    .chat-theme-terminal .chat-typing { background: transparent; border: none; color: #00ff41; }
    .chat-theme-terminal .chat-send-btn { color: #00ff41 !important; }
    .chat-theme-terminal .source-chip {
      background: transparent !important;
      border-color: #00ff41 !important;
      color: #00ff41 !important;
      font-family: 'Courier New', monospace;
    }
    .chat-theme-terminal .chat-empty-icon { color: #00ff41 !important; opacity: 0.3; }

    /* Theme picker button */
    .theme-btn {
      width: 1.4rem; height: 1.4rem; border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .theme-btn:hover { transform: scale(1.15); }
    .theme-btn.active { border-color: #fff; }
    .chat-theme-white .theme-btn.active { border-color: #333; }
    .chat-theme-terminal .theme-btn.active { border-color: #00ff41; }
  `}</style>
);

// ── Site theme definitions ──────────────────────────────────────────────
const SITE_THEMES = [
  { id: 'void',    label: 'Void',   color: '#000000', textColor: '#ffffff' },
  { id: 'pearl',   label: 'Pearl',  color: '#f5f3ef', textColor: '#1a1a1a' },
  { id: 'sakura',  label: 'Sakura', color: '#ff6496', textColor: '#ffe4ec' },
  { id: 'ocean',   label: 'Ocean',  color: '#1e6eb5', textColor: '#ccd6f6' },
];

// ── Chat theme definitions ──────────────────────────────────────────────
const CHAT_THEMES = [
  { id: 'black',     label: 'Black',     color: '#000000' },
  { id: 'white',     label: 'White',     color: '#f4f4f4' },
  { id: 'terminal',  label: 'Terminal',  color: '#00ff41' },
];


export default function App() {
  const [documents, setDocuments]   = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(Date.now());
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [input, setInput]           = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping]     = useState(false);
  const [email, setEmail]           = useState('');
  const endRef = useRef(null);

  // Site theme — persisted across sessions
  const [siteTheme, setSiteTheme] = useState(() => {
    const saved = localStorage.getItem('siteTheme');
    return ['void','pearl','sakura','ocean'].includes(saved) ? saved : 'void';
  });
  const applySiteTheme = (id) => {
    setSiteTheme(id);
    localStorage.setItem('siteTheme', id);
  };
  // Apply site theme class to body
  useEffect(() => {
    document.body.className = document.body.className
      .split(' ').filter(c => !c.startsWith('site-theme-')).join(' ');
    document.body.classList.add(`site-theme-${siteTheme}`);
  }, [siteTheme]);

  // Chat theme — persisted across sessions
  const [chatTheme, setChatTheme] = useState(() => {
    const saved = localStorage.getItem('chatTheme');
    if (['black', 'white', 'terminal'].includes(saved)) return saved;
    // Map old or default
    if (saved === 'gpt-light') return 'white';
    return 'black';
  });
  const applyTheme = (id) => {
    setChatTheme(id);
    localStorage.setItem('chatTheme', id);
  };

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  const [user, setUser] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameInput, setEditUsernameInput] = useState('');

  /* Scroll-reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
      setUser(res.data);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchDocuments();
      fetchUser();
      fetchSessions();
    } else {
      localStorage.removeItem('token');
      setDocuments([]);
      setChatHistory([]);
      setSavedSessions([]);
      setUser(null);
    }
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Client-side email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    // Password length check on register
    if (!isLogin && authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    try {
      if (isLogin) {
        const fd = new URLSearchParams();
        fd.append('username', authEmail);
        fd.append('password', authPassword);
        const res = await axios.post(`${API_BASE}/auth/token`, fd, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        setToken(res.data.access_token);
        setAuthModalOpen(false);
      } else {
        await axios.post(`${API_BASE}/auth/register`, { email: authEmail, password: authPassword, username: authName });
        setIsLogin(true);
        setAuthError('Registration successful. Please login.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email already registered') {
        setAuthError('This email is already registered. Please log in instead.');
      } else {
        setAuthError(detail || 'Something went wrong. Please try again.');
      }
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setAuthError('');
      try {
        const res = await axios.post(`${API_BASE}/auth/google`, {
          token: credentialResponse.access_token
        });
        setToken(res.data.access_token);
        setAuthModalOpen(false);
      } catch (err) {
        setAuthError(err.response?.data?.detail || 'Google Authentication failed');
      }
    },
    onError: () => {
      setAuthError('Google Sign-In failed.');
    }
  });

  const logout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setToken(null);
    }
  };
  useEffect(() => {
    if (chatHistory.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions`, { headers: { Authorization: `Bearer ${token}` }});
      setSavedSessions(res.data);
      if (res.data.length > 0) {
        setActiveSessionId(res.data[0].id);
        setChatHistory(res.data[0].messages);
      } else {
        setActiveSessionId(Date.now());
      }
    } catch(e) { console.error(e); }
  }

  const handleNewChat = async () => {
    try {
      const res = await axios.post(`${API_BASE}/sessions`, { name: 'New Chat' }, { headers: { Authorization: `Bearer ${token}` }});
      setSavedSessions(prev => [res.data, ...prev]);
      setActiveSessionId(res.data.id);
      setChatHistory([]);
    } catch (e) { console.error(e); }
  };

  const switchSession = (session) => {
    setChatHistory(session.messages);
    setActiveSessionId(session.id);
  };

  const saveSessionEdit = async (id) => {
    try {
      await axios.put(`${API_BASE}/sessions/${id}`, { name: editSessionName }, { headers: { Authorization: `Bearer ${token}` }});
      setSavedSessions(prev => prev.map(s => s.id === id ? { ...s, name: editSessionName } : s));
      setEditingSessionId(null);
    } catch(e) { console.error(e); }
  };

  const saveUsernameEdit = async () => {
    if (!editUsernameInput.trim()) {
      setIsEditingUsername(false);
      return;
    }
    try {
      const res = await axios.put(`${API_BASE}/auth/me`, { username: editUsernameInput }, { headers: { Authorization: `Bearer ${token}` }});
      setUser(res.data);
      setIsEditingUsername(false);
    } catch(e) { console.error(e); }
  };

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
      fetchDocuments();
    }
  });

  const handleDelete = async (id) => {
    try { await axios.delete(`${API_BASE}/documents/${id}`, { headers: { Authorization: `Bearer ${token}` }}); fetchDocuments(); } catch (e) { console.error(e); }
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;
    
    let currentSessionId = activeSessionId;
    if (!savedSessions.find(s => s.id === currentSessionId)) {
        const res = await axios.post(`${API_BASE}/sessions`, { name: input.slice(0, 30) || 'New Chat' }, { headers: { Authorization: `Bearer ${token}` }});
        currentSessionId = res.data.id;
        setActiveSessionId(currentSessionId);
        setSavedSessions(prev => [res.data, ...prev]);
    }

    const userMsg = { role: 'user', content: input };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      await axios.post(`${API_BASE}/sessions/${currentSessionId}/messages`, userMsg, { headers: { Authorization: `Bearer ${token}` }});
    } catch(e) { console.error("Failed to save user message", e); }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: input })
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let bot = { role: 'bot', content: '', sources: [] };
      setChatHistory(prev => [...prev, bot]);
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer
        for (const line of lines) {
          if (!line.trim()) continue;
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
      
      try {
        await axios.post(`${API_BASE}/sessions/${currentSessionId}/messages`, bot, { headers: { Authorization: `Bearer ${token}` }});
      } catch(e) { console.error("Failed to save bot message", e); }

    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', content: 'An error occurred.' }]);
    } finally { setIsTyping(false); }
  };

  return (
    <>
      <GlobalStyle />

      {/* Profile Modal */}
      {profileModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '1rem' }}>
          <div className="liquid-glass fade-in-up" style={{ width: '100%', maxWidth: '440px', borderRadius: '1.5rem', padding: '2.5rem 2rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto' }}>
            <button onClick={() => setProfileModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', width: '2rem', height: '2rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#dedbc8', marginBottom: '1rem' }}>account_circle</span>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem' }}>My Profile</h2>
            <div className="reveal-line"></div>
            
            <div style={{ width: '100%', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Name</span>
                {isEditingUsername ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={editUsernameInput}
                      onChange={e => setEditUsernameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveUsernameEdit()}
                      autoFocus
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #fff', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'right', width: '130px' }}
                    />
                    <button onClick={saveUsernameEdit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.4rem', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>check</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#fff' }}>{user?.username || '—'}</span>
                    <button onClick={() => { setEditUsernameInput(user?.username || ''); setIsEditingUsername(true); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>edit</span>
                    </button>
                  </div>
                )}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Email</span>
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>{user?.email || 'Loading...'}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Status</span>
                <span style={{ fontSize: '0.9rem', color: '#90ee90' }}>Active</span>
              </div>
            </div>
            
            <button onClick={() => { setProfileModalOpen(false); logout(); }} style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '9999px', background: 'rgba(255,100,100,0.1)', color: '#ffb4ab', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,100,100,0.3)', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,100,100,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,100,100,0.1)'}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '1rem', overflowY: 'auto' }}>
          <div className="liquid-glass fade-in-up" style={{ width: '100%', maxWidth: '440px', borderRadius: '1.5rem', padding: '2.5rem 2rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto', maxHeight: '95vh', overflowY: 'auto' }}>
            <button onClick={() => { setAuthModalOpen(false); setAuthError(''); setAuthEmail(''); setAuthPassword(''); setAuthName(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', width: '2rem', height: '2rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
            </button>

            <div style={{ width: '100%', textAlign: 'center', marginBottom: '1.75rem', paddingTop: '0.5rem' }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 6vw, 2.75rem)', fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                {isLogin ? 'Welcome Back' : 'Join the Collective'}
              </h2>
              <div className="reveal-line"></div>
              {!isLogin && (
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>
                  Entry into the NOVASYNC creative ecosystem.
                </p>
              )}
            </div>

            {authError && (
              <div style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: authError.includes('successful') ? 'rgba(100,200,100,0.1)' : 'rgba(255,100,100,0.1)', border: `1px solid ${authError.includes('successful') ? 'rgba(100,200,100,0.3)' : 'rgba(255,100,100,0.3)'}`, marginBottom: '1.25rem', textAlign: 'center' }}>
                <p style={{ color: authError.includes('successful') ? '#90ee90' : '#ffb4ab', fontSize: '0.82rem', margin: 0 }}>{authError}</p>
              </div>
            )}

            <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginLeft: '0.25rem' }}>Full Name <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>(optional)</span></label>
                  <input className="liquid-input" type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Alexander Vance" style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', fontFamily: 'Almarai, sans-serif' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginLeft: '0.25rem' }}>Email Address</label>
                <input className="liquid-input" type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={isLogin ? 'name@studio.com' : 'you@studio.com'} style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', fontFamily: 'Almarai, sans-serif' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Password</label>
                  {isLogin && <a href="#" style={{ fontSize: '0.7rem', color: 'rgba(251,247,228,0.5)', textDecoration: 'none' }}>Forgot?</a>}
                </div>
                <input className="liquid-input" type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', fontFamily: 'Almarai, sans-serif' }} />
              </div>

              <div style={{ paddingTop: '0.75rem' }}>
                <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '9999px', background: '#dedbc8', color: '#323124', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.3s', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>
              
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ padding: '0 0.75rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              
              {/* Google Button */}
              <div>
                <button type="button" onClick={() => loginWithGoogle()} style={{ width: '100%', padding: '0.9rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" style={{ width: '18px', height: '18px' }} />
                  Continue with Google
                </button>
              </div>
            </form>

            <div style={{ marginTop: '1.5rem', width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#bab8b7' }}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <span onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                  style={{ color: '#fbf7e4', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'rgba(251,247,228,0.3)', marginLeft: '0.25rem' }}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </span>
              </p>
              {!isLogin && (
                <p style={{ fontSize: '0.7rem', color: 'rgba(201,198,188,0.35)', marginTop: '1rem', lineHeight: 1.6 }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
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
          <div className="nav-links">
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>Features</a>
            <a href="#dashboard" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>Dashboard</a>
            <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
               onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.5)'}>About</a>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Site Theme Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', padding: '0.35rem 0.6rem' }}>
              {SITE_THEMES.map(t => (
                <button key={t.id} onClick={() => applySiteTheme(t.id)} title={t.label}
                  style={{ width: '0.95rem', height: '0.95rem', borderRadius: '50%', background: t.color, border: siteTheme === t.id ? '2px solid rgba(255,255,255,0.85)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s', transform: siteTheme === t.id ? 'scale(1.25)' : 'scale(1)', outline: 'none', flexShrink: 0 }}
                />
              ))}
            </div>
            {!token ? (
              <>
                <button onClick={() => { setIsLogin(false); setAuthModalOpen(true); }} style={{ background: 'none', border: 'none', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Sign Up</button>
                <button onClick={() => { setIsLogin(true); setAuthModalOpen(true); }} className="liquid-glass" style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', color: '#fff', cursor: 'pointer' }}>Login</button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button onClick={() => setProfileModalOpen(true)} className="liquid-glass" style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>person</span> Profile
                </button>
                <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Logout</button>
              </div>
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
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '900px', marginTop: '5rem' }}>
          <div className="animate-pull-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9999px', padding: '0.35rem 1rem', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '9999px', background: '#90ee90', boxShadow: '0 0 6px #90ee90', display: 'inline-block' }} />
            Powered by Nexus
          </div>

          <h1 className="animate-pull-up" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(3.5rem, 10vw, 7rem)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400, animationDelay: '0.1s', opacity: 0 }}>
            Know it then <span className="italic-em">all</span>
          </h1>

          <p className="animate-pull-up" style={{ animationDelay: '0.25s', opacity: 0, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '520px', lineHeight: 1.7 }}>
            Upload your documents and chat with them in real time — powered by hybrid semantic retrieval and AI.
          </p>

          {/* CTA Buttons */}
          <div className="animate-pull-up" style={{ animationDelay: '0.4s', opacity: 0, display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => { setIsLogin(false); setAuthModalOpen(true); }}
              style={{ background: '#dedbc8', color: '#323124', border: 'none', borderRadius: '9999px', padding: '0.9rem 2.5rem', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 24px -6px rgba(222,219,200,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 32px -6px rgba(222,219,200,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(222,219,200,0.3)'; }}>
              Get Started — Free
            </button>
            <a href="#dashboard" className="liquid-glass"
              style={{ borderRadius: '9999px', padding: '0.9rem 2.5rem', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-block', textDecoration: 'none', color: '#fff', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              Explore Platform
            </a>
          </div>

          <p className="animate-pull-up" style={{ animationDelay: '0.5s', opacity: 0, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>No credit card required · Setup in seconds</p>
        </div>

        {/* Bottom social pills */}
        <div style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', zIndex: 10 }}>
          {[
            { icon: 'photo_camera', href: 'https://instagram.com/__.satoru._.gojo.__1' },
            { icon: 'mail', href: 'mailto:thangapreethi85@gmail.com' }
          ].map(item => (
            <a key={item.icon} href={item.href} target="_blank" rel="noopener noreferrer" className="liquid-glass" style={{ width: '3rem', height: '3rem', borderRadius: '9999px', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="about-section" style={{ background: 'var(--site-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="reveal-on-scroll" style={{ maxWidth: '900px' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '1.5rem' }}>About Nexus</span>
          <h2 style={{ fontFamily: 'Almarai, sans-serif', fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', fontWeight: 300, lineHeight: 1.2, marginBottom: '2rem' }}>
            Elevating <span className="italic-em" style={{ color: 'rgba(255,255,255,0.8)' }}>Student Wellness</span> through intelligent design.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontSize: '1.05rem', maxWidth: '780px', margin: '0 auto' }}>
            Nexus is our flagship student wellness platform designed to bridge the gap between academic excellence and mental well-being. By integrating powerful AI document analysis with holistic health tracking, we provide an ecosystem where students can effortlessly manage their studies while maintaining a balanced lifestyle.
          </p>
        </div>
      </section>

      {/* ── FEATURED VIDEO ── */}
      <section style={{ padding: '0 2rem 8rem' }}>
        <div className="reveal-on-scroll" style={{ maxWidth: '1280px', margin: '0 auto', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
          <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '8rem 2rem', background: 'var(--site-bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Section Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '1.5rem' }}>What We Offer</span>
            <h2 style={{ fontFamily: 'Almarai, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Everything you need to <span className="italic-em" style={{ color: 'rgba(255,255,255,0.8)' }}>study smarter</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
              Nexus turns your study materials into an interactive AI assistant — so you spend less time searching and more time understanding.
            </p>
          </div>
          {/* Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { num: '01', icon: 'upload_file',   title: 'Upload Your Materials',   desc: 'Drop in any PDF, Word doc, or text file. Nexus reads and understands your documents instantly — no setup needed.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4' },
            { num: '02', icon: 'manage_search', title: 'Smart Search',     desc: 'Ask any question and get the most relevant answer from your documents. Nexus finds exactly what you need, even if you do not remember the exact words.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4' },
            { num: '03', icon: 'forum',         title: 'Chat with Your Notes',    desc: 'Have a real conversation with your study materials. Ask follow-up questions, get summaries, and receive answers with exact references so you always know the source.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4' },
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
        </div>
      </section>


      {/* ── DASHBOARD ── */}
      <section id="dashboard" className="dashboard-section" style={{ background: 'var(--site-bg)' }}>
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

          <div className="hub-grid" style={{ gap: '1.5rem' }}>

            {/* CHAT HISTORY */}
            <div className="liquid-glass reveal-on-scroll" style={{ borderRadius: '2rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', transitionDelay: '0.1s', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>history</span>
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Chat History</span>
                </div>
                <button onClick={handleNewChat} className="liquid-glass" style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '9999px', padding: '0.3rem 0.7rem', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>add</span> New
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
                {/* Active Session (if unsaved) */}
                {!savedSessions.find(s => s.id === activeSessionId) && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <p style={{ fontSize: '0.82rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Current Session</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>{chatHistory.length > 0 ? 'Active now' : 'Just started'}</p>
                  </div>
                )}
                
                {/* Saved Sessions */}
                {savedSessions.map(session => (
                  <div key={session.id} onClick={() => switchSession(session)} style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: session.id === activeSessionId ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {editingSessionId === session.id ? (
                      <input 
                        type="text" 
                        value={editSessionName} 
                        onChange={(e) => setEditSessionName(e.target.value)}
                        onBlur={() => saveSessionEdit(session.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveSessionEdit(session.id)}
                        autoFocus
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #fff', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <p style={{ fontSize: '0.82rem', color: session.id === activeSessionId ? '#fff' : 'rgba(255,255,255,0.6)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.name}</p>
                          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>{session.messages.length} messages</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingSessionId(session.id); 
                            setEditSessionName(session.name); 
                          }} 
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CHAT */}
            <div className="reveal-on-scroll" style={{ transitionDelay: '0.2s', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
              <div className={`liquid-glass chat-theme-${chatTheme}`} style={{ flex: 1, borderRadius: '2rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: 0, boxSizing: 'border-box', overflow: 'hidden' }}>

              {/* Header: status indicator + theme picker */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: '0.6rem', height: '0.6rem', borderRadius: '9999px', background: chatTheme === 'terminal' ? '#00ff41' : chatTheme === 'white' ? '#333' : '#fff', boxShadow: chatTheme === 'terminal' ? '0 0 8px #00ff41' : '0 0 8px rgba(255,255,255,0.8)' }} />
                  <span className="chat-header-label" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Chat active</span>
                </div>
                {/* Theme swatches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} title="Switch chat theme">
                  {CHAT_THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`theme-btn${chatTheme === t.id ? ' active' : ''}`}
                      style={{ background: t.color }}
                      title={t.label}
                      onClick={() => applyTheme(t.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', minHeight: 0 }}>
                {chatHistory.length === 0 ? (
                  <div className="chat-empty-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', opacity: 0.4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>forum</span>
                    <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Ask anything about your documents</p>
                  </div>
                ) : chatHistory.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div
                      className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}
                      style={{ padding: '0.6rem 0.9rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.82rem', lineHeight: 1.6, wordBreak: 'break-words' }}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.4rem' }}>
                        {msg.sources.map((s, idx) => (
                          <span key={idx} className="source-chip" style={{ padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.65rem' }}>description</span> {s.file}{s.section ? ` — ${s.section}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-typing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: '0.75rem', fontSize: '0.82rem', width: 'fit-content' }}>
                    <span className="material-symbols-outlined spin" style={{ fontSize: '0.9rem' }}>refresh</span> Processing…
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div style={{ flexShrink: 0, position: 'relative' }}>
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything…"
                  className="chat-input-box"
                  style={{ width: '100%', borderRadius: '0.75rem', padding: '0.85rem 3rem 0.85rem 1rem', fontSize: '0.82rem', fontFamily: 'Almarai, sans-serif', boxSizing: 'border-box' }}
                />
                <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: input.trim() ? '#fff' : 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
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
      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--site-border, rgba(255,255,255,0.06))', background: 'var(--site-bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
              <span style={{ fontWeight: 800, letterSpacing: '-0.04em', fontSize: '1.1rem' }}>NOVASYNC</span>
            </div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>© 2026 NOVASYNC. ALL RIGHTS RESERVED.</p>
          </div>
          <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.35)'}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.35)'}>Terms</a>
            <a href="https://instagram.com/__.satoru._.gojo.__1" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.35)'}>Instagram</a>
          </div>
        </div>
      </footer>
    </>
  );
}
