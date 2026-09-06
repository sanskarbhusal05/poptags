import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Phone, Globe, MessageSquare, MapPin, 
  Instagram, Plus, Trash2, ArrowRight, ArrowLeft, 
  ExternalLink, Sparkles, Copy, Check, Sun, Moon,
  QrCode, Share2, Download, CreditCard, Radio, Smartphone,
  CheckCircle2, PhoneCall, ShoppingBag, Loader2
} from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(1);
  const [profileId, setProfileId] = useState('demo-shop');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Global & Profile Theme: 'dark' (Black) or 'light' (White)
  const [theme, setTheme] = useState('dark');

  // Step 1 Form State
  const [ownerName, setOwnerName] = useState('Sanskar Bhusal');
  const [shopName, setShopName] = useState('POP TAGS PVT LTD');
  const [contactNo, setContactNo] = useState('+91 97307 04525');
  const [bio, setBio] = useState('Premium cards & digital tags');

  // Step 2 Links State
  const [links, setLinks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('whatsapp');

  // View Mode: 'editor' or 'public'
  const [viewMode, setViewMode] = useState('editor');
  const [showQrModal, setShowQrModal] = useState(false);

  // 1. On Mount: Check if visiting public link (/u/:id) or load profile from backend
  useEffect(() => {
    const path = window.location.pathname;
    let targetId = 'demo-shop';

    if (path.includes('/u/')) {
      const parts = path.split('/u/')[1];
      if (parts) {
        targetId = parts.replace(/\/$/, '');
        setViewMode('public');
      }
    }

    setProfileId(targetId);
    fetchProfile(targetId);
  }, []);

  // Fetch profile and links from backend
  const fetchProfile = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setOwnerName(data.profile.owner_name || '');
          setShopName(data.profile.shop_name || '');
          setContactNo(data.profile.contact_no || '');
          setBio(data.profile.bio || '');
          setProfileId(data.profile.id);
        }
        if (data.links) {
          setLinks(data.links.map(l => ({
            id: l.id,
            title: l.title,
            url: l.url,
            type: l.type || 'link',
            click_count: l.click_count || 0
          })));
        }
      }
    } catch (err) {
      console.log('Using local state / fallback');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1 Save: Save profile to Database & Move to Step 2
  const handleSaveStep1 = async (e) => {
    e.preventDefault();
    if (!ownerName || !shopName || !contactNo) return;
    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: ownerName,
          shop_name: shopName,
          contact_no: contactNo,
          bio: bio,
          profile_id: profileId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile_id) {
          setProfileId(data.profile_id);
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  // STEP 2 Add Link: Save to Database
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          title: newTitle.trim(),
          url: formattedUrl,
          type: newType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLinks([...links, {
          id: data.link_id || Date.now(),
          title: newTitle.trim(),
          url: formattedUrl,
          type: newType,
          click_count: 0
        }]);
      } else {
        setLinks([...links, { id: Date.now(), title: newTitle.trim(), url: formattedUrl, type: newType }]);
      }
    } catch (err) {
      setLinks([...links, { id: Date.now(), title: newTitle.trim(), url: formattedUrl, type: newType }]);
    }

    setNewTitle('');
    setNewUrl('');
  };

  // Delete Link from Database
  const handleDeleteLink = async (id) => {
    try {
      await fetch(`/api/links/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting link:', err);
    }
    setLinks(links.filter(l => l.id !== id));
  };

  // Record Click & Open URL
  const handleLinkClick = async (linkId, url) => {
    try {
      fetch(`/api/links/${linkId}/click`, { method: 'POST' });
    } catch (err) {}
    window.open(url, '_blank');
  };

  // Share / Copy Public Link
  const getPublicUrl = () => {
    return `${window.location.origin}/u/${profileId}`;
  };

  const copyPublicLink = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate & Download vCard (.vcf)
  const downloadVCard = () => {
    const cleanNum = contactNo.replace(/[^0-9+]/g, '');
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName} (${shopName})
ORG:${shopName}
TITLE:Owner
TEL;TYPE=CELL,VOICE:${cleanNum}
NOTE:${bio}
URL:${getPublicUrl()}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${shopName.replace(/[^a-zA-Z0-9]/g, '_')}_contact.vcf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getLinkIcon = (type) => {
    switch (type) {
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'map': return <MapPin className="w-4 h-4 text-red-400" />;
      case 'call': return <PhoneCall className="w-4 h-4 text-blue-400" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'store': return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      default: return <Globe className="w-4 h-4 text-indigo-400" />;
    }
  };

  const isDark = theme === 'dark';
  const cleanPhone = contactNo.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${shopName}, I would like to inquire about your products.`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getPublicUrl())}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans ${
      isDark ? 'bg-[#09090b] text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Top Header Navigation */}
      <header className={`border-b sticky top-0 z-40 py-3 px-4 sm:px-8 flex items-center justify-between transition-colors backdrop-blur-md ${
        isDark ? 'border-zinc-800 bg-[#09090b]/90 text-white' : 'border-slate-200 bg-white/90 text-slate-900 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="PopTags Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="text-xs font-bold text-amber-400">PT</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight flex items-center gap-1.5">
              PopTags
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono">
                Live
              </span>
            </h1>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Smart Digital Business Card & Links</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Download Excel Sheet */}
          <a
            href="/api/export/csv"
            download="poptags_data.csv"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isDark 
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Download All Data to Excel"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Export Excel</span>
          </a>

          {/* Black / White Theme Toggle */}
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isDark 
                ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700' 
                : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
            }`}
            title="Toggle Black / White Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden md:inline">{isDark ? 'White Theme' : 'Black Theme'}</span>
          </button>

          {/* Copy Shareable Link */}
          <button 
            onClick={copyPublicLink}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>

          {/* View Mode Toggle */}
          <button 
            onClick={() => setViewMode(viewMode === 'editor' ? 'public' : 'editor')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              isDark 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
            }`}
          >
            {viewMode === 'editor' ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{viewMode === 'editor' ? 'View Live Page' : 'Back to Editor'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'editor' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: 2-Step Form Wizard */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step Wizard Navigation Bar */}
            <div className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between transition-colors ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    step === 1 
                      ? (isDark ? 'bg-white text-black shadow-md' : 'bg-slate-900 text-white shadow-md')
                      : (isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900')
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isDark ? 'bg-black text-white' : 'bg-white text-black'
                  }`}>1</span>
                  Business Profile
                </button>

                <button 
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    step === 2 
                      ? (isDark ? 'bg-white text-black shadow-md' : 'bg-slate-900 text-white shadow-md')
                      : (isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900')
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-zinc-700 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  Links & Buttons ({links.length})
                </button>
              </div>

              {/* Status Badge */}
              <div className="text-[11px] text-zinc-400 font-mono">
                ID: <span className="text-emerald-400 font-bold">{profileId}</span>
              </div>
            </div>

            {/* STEP 1 FORM: Profile & Business Info */}
            {step === 1 && (
              <div className={`border rounded-2xl p-6 space-y-5 shadow-xl transition-colors ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Step 1: Business Profile & Contact Info
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Enter your shop and contact details. This saves directly to your database.
                  </p>
                </div>

                <form onSubmit={handleSaveStep1} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Shop / Business Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        required
                        value={shopName} 
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. POP TAGS PVT LTD"
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Shop Owner Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        required
                        value={ownerName} 
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Sanskar Bhusal"
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>WhatsApp / Contact Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        required
                        value={contactNo} 
                        onChange={(e) => setContactNo(e.target.value)}
                        placeholder="e.g. +91 97307 04525"
                        className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Tagline / Bio</label>
                    <textarea 
                      rows={2}
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Premium cards & digital tags"
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500'
                      }`}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full py-3 text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 mt-4 ${
                      isDark ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save & Next: Manage Links <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2 FORM: Links Section */}
            {step === 2 && (
              <div className={`border rounded-2xl p-6 space-y-6 shadow-xl transition-colors ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" /> Step 2: Manage Your Links
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Add WhatsApp, Instagram, LinkedIn, Google Maps, or your website.
                    </p>
                  </div>
                </div>

                {/* PROMINENT NFC CARD LINK BOX */}
                <div className={`p-4 rounded-2xl border-2 transition ${
                  isDark ? 'bg-zinc-950/80 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Your NFC Card Link
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      Write this to NFC Card
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={getPublicUrl()}
                      className={`flex-1 px-3 py-2 text-xs font-mono rounded-xl border select-all ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-emerald-300 text-slate-800'
                      }`}
                    />
                    <button 
                      onClick={copyPublicLink}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy NFC Link'}</span>
                    </button>
                  </div>
                  <p className={`text-[11px] mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    💡 <strong>How to use:</strong> Open NFC Tools on your phone, select <em>Write ➔ Add Record ➔ URL</em>, paste this link, and tap your NFC card.
                  </p>
                </div>

                {/* Add New Link Form */}
                <form onSubmit={handleAddLink} className={`p-4 border rounded-xl space-y-3 ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Add New Link Button
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      required
                      placeholder="Button Title (e.g. Chat on WhatsApp)" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className={`px-3 py-2 text-xs border rounded-xl focus:outline-none ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input 
                      type="text" 
                      required
                      placeholder="Target URL (e.g. wa.me/... or instagram.com/...)" 
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className={`px-3 py-2 text-xs border rounded-xl focus:outline-none ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <select 
                      value={newType} 
                      onChange={(e) => setNewType(e.target.value)}
                      className={`px-3 py-2 text-xs border rounded-xl focus:outline-none ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="whatsapp">💬 WhatsApp</option>
                      <option value="instagram">📷 Instagram</option>
                      <option value="map">📍 Google Maps</option>
                      <option value="call">📞 Phone Call</option>
                      <option value="payment">💳 UPI / Payment</option>
                      <option value="store">🛍️ Online Store</option>
                      <option value="link">🔗 Standard Link</option>
                    </select>

                    <button 
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  </div>
                </form>

                {/* Existing Links List */}
                <div className="space-y-2">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Active Links ({links.length})
                  </h3>
                  
                  {links.map((link) => (
                    <div 
                      key={link.id}
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition ${
                        isDark ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                          {getLinkIcon(link.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate">{link.title}</h4>
                          <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {link.click_count !== undefined && (
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
                            {link.click_count} clicks
                          </span>
                        )}
                        <button 
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {links.length === 0 && (
                    <p className="text-xs text-zinc-400 italic py-3 text-center border border-dashed rounded-xl border-zinc-800">
                      No links added yet. Paste a link above to add your first button.
                    </p>
                  )}
                </div>

                {/* Back / View Actions */}
                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button 
                    onClick={() => setStep(1)} 
                    className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile Info
                  </button>

                  <button 
                    onClick={() => setViewMode('public')}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-zinc-200 font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Live Landing Page
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Mobile Phone Live Preview */}
          <div className="lg:col-span-5 flex flex-col items-center sticky top-20">
            <div className={`text-xs font-medium mb-3 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Real-time Live Preview
            </div>

            {/* Mobile Device Frame */}
            <div className={`w-full max-w-[320px] rounded-[44px] border-4 p-3 shadow-2xl relative overflow-hidden transition-colors ${
              isDark ? 'border-zinc-700 bg-black' : 'border-slate-400 bg-slate-200'
            }`}>
              
              <div className={`w-28 h-4 mx-auto rounded-b-xl mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-400'}`}></div>

              <div className={`space-y-4 text-center pb-4 rounded-3xl p-4 min-h-[460px] flex flex-col justify-between border transition-colors ${
                isDark 
                  ? 'bg-black text-white border-zinc-900' 
                  : 'bg-white text-slate-900 border-slate-200 shadow-inner'
              }`}>
                
                <div className="space-y-3">
                  {/* Shop Logo Avatar */}
                  <div className="relative w-20 h-20 mx-auto mt-2">
                    <div className={`w-20 h-20 rounded-full border-2 p-1 flex items-center justify-center overflow-hidden shadow-xl ${
                      isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-slate-100'
                    }`}>
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
                      <span className="text-xl font-black text-amber-400">
                        {shopName.substring(0, 2).toUpperCase() || 'PT'}
                      </span>
                    </div>
                  </div>

                  {/* Shop & Owner Details */}
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight flex items-center justify-center gap-1.5">
                      {shopName || 'Shop Name'}
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    </h3>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      Owner: {ownerName || 'Owner Name'}
                    </p>
                    <p className="text-[11px] text-emerald-500 mt-1 font-mono font-semibold">
                      📞 {contactNo || '+91 97307 04525'}
                    </p>
                    {bio && (
                      <p className={`text-[11px] mt-1.5 leading-snug px-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {bio}
                      </p>
                    )}
                  </div>

                  {/* Quick Action Buttons: Call & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${contactNo.replace(/[^0-9+]/g, '')}`}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                      <span>Call</span>
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Link Buttons */}
                  <div className="space-y-2 pt-2">
                    {links.length > 0 ? (
                      links.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => handleLinkClick(l.id, l.url)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 shadow-sm ${
                            isDark 
                              ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                          }`}
                        >
                          {getLinkIcon(l.type)}
                          <span className="truncate">{l.title}</span>
                        </button>
                      ))
                    ) : (
                      <div className="py-4 text-xs text-zinc-400 italic">
                        No links added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Contact Button */}
                <div className="pt-3">
                  <button
                    onClick={downloadVCard}
                    className={`w-full py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" /> Save Contact to Phone
                  </button>
                </div>

                {/* Footer Branding */}
                <div className={`pt-3 border-t ${isDark ? 'border-zinc-900' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-center gap-2 text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    <span>Powered by <strong className="font-bold">PopTags</strong></span>
                  </div>
                </div>

              </div>

              <div className={`w-24 h-1 mx-auto rounded-full mt-3 ${isDark ? 'bg-zinc-700' : 'bg-slate-400'}`}></div>
            </div>

          </div>

        </main>
      ) : (
        /* ================= PUBLIC LIVE LANDING VIEW ================= */
        <main className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
          isDark ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
        }`}>
          
          {/* Top Actions Floating Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-full shadow-lg">
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="px-3 py-1 text-xs font-bold rounded-full bg-white text-black hover:bg-zinc-200 transition flex items-center gap-1"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-800" />}
              <span>{isDark ? 'White Theme' : 'Black Theme'}</span>
            </button>

            <button 
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>QR Code</span>
            </button>

            {!window.location.pathname.includes('/u/') && (
              <button 
                onClick={() => setViewMode('editor')}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
              >
                <span>Edit Card</span>
              </button>
            )}
          </div>

          {/* Public Mobile Card Container */}
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl my-auto transition-colors ${
            isDark ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Logo Avatar */}
            <div className={`w-24 h-24 rounded-full border-2 p-1 mx-auto overflow-hidden shadow-xl flex items-center justify-center ${
              isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-slate-100'
            }`}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="text-2xl font-black text-amber-400">
                {shopName.substring(0, 2).toUpperCase() || 'PT'}
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
                {shopName}
                <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" />
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Owner: {ownerName}
              </p>
              <p className="text-sm text-emerald-500 font-mono font-bold pt-1">
                📞 {contactNo}
              </p>
              {bio && (
                <p className={`text-xs mt-2 px-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {bio}
                </p>
              )}
            </div>

            {/* Primary Action Buttons: Call Now & WhatsApp */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a 
                href={`tel:${contactNo.replace(/[^0-9+]/g, '')}`}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 shadow-sm ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                }`}
              >
                <PhoneCall className="w-4 h-4 text-blue-400" />
                <span>Call Now</span>
              </a>

              <a 
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* All Custom Links */}
            <div className="space-y-3 pt-2">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLinkClick(l.id, l.url)}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2.5 shadow-md hover:scale-[1.01] ${
                    isDark 
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  }`}
                >
                  {getLinkIcon(l.type)}
                  <span className="truncate">{l.title}</span>
                </button>
              ))}
            </div>

            {/* 1-Tap Save Contact to Phone Button */}
            <div className="pt-2">
              <button
                onClick={downloadVCard}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" /> Save Contact to Phone (.vcf)
              </button>
            </div>

            {/* Footer */}
            <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className={`flex items-center justify-center gap-2 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                <span>Powered by <strong className="font-extrabold tracking-tight">PopTags</strong></span>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ================= MODAL: QR CODE DISPLAY ================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm border rounded-3xl p-6 text-center space-y-4 shadow-2xl ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base">Scan Card QR Code</h3>
            <p className="text-xs text-zinc-400">Anyone can scan this QR code with their camera</p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img 
                src={qrCodeUrl} 
                alt="Card QR Code" 
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={copyPublicLink}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button 
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
