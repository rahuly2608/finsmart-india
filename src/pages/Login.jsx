
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalUsers: 0,
    totalTransactions: 0,
    avgRating: 0
  })

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const txSnap = await getDocs(collection(db, 'transactions'))
      let totalAmount = 0
      txSnap.forEach(d => { totalAmount += Number(d.data().amount || 0) })
      const userSnap = await getDocs(collection(db, 'users'))
      const ratingSnap = await getDocs(collection(db, 'ratings'))
      let totalRating = 0
      ratingSnap.forEach(d => { totalRating += Number(d.data().rating || 0) })
      const avgRating = ratingSnap.size > 0 ? (totalRating / ratingSnap.size).toFixed(1) : 0
      setStats({
        totalAmount,
        totalUsers: userSnap.size,
        totalTransactions: txSnap.size,
        avgRating
      })
    } catch (e) { console.log(e) }
  }

  function formatAmount(amount) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`
    return `₹${amount}`
  }

  async function handleSubmit() {
    if (!email || !password) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          createdAt: new Date().toISOString(),
          uid: cred.user.uid
        })
        setShowRating(true)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('Account not found. Please register.')
      else if (err.code === 'auth/wrong-password') setError('Wrong password. Try again.')
      else if (err.code === 'auth/email-already-in-use') setError('Email already registered. Please login.')
      else setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function submitRating(rating) {
    try {
      const user = auth.currentUser
      if (user) {
        await addDoc(collection(db, 'ratings'), {
          userId: user.uid,
          rating: rating,
          createdAt: new Date().toISOString()
        })
      }
    } catch (e) { console.log(e) }
    navigate('/dashboard')
  }

  if (showRating) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: 380, textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Welcome to FinSmart India!</h2>
          <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 28px' }}>How would you rate your first impression?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setUserRating(star)}
                style={{ fontSize: 36, background: 'none', border: 'none', cursor: 'pointer', color: star <= (hoverRating || userRating) ? '#f59e0b' : '#e5e7eb', transition: 'all 0.15s', transform: star <= (hoverRating || userRating) ? 'scale(1.2)' : 'scale(1)' }}>
                ★
              </button>
            ))}
          </div>
          {userRating > 0 && (
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 20 }}>
              {userRating === 5 ? '🥰 Amazing! Thank you!' : userRating === 4 ? '😊 Great! Thanks!' : userRating === 3 ? '😐 Thanks for the feedback!' : '😔 We will improve!'}
            </p>
          )}
          <button
            onClick={() => userRating > 0 ? submitRating(userRating) : navigate('/dashboard')}
            style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {userRating > 0 ? 'Submit & Go to Dashboard →' : 'Skip for now'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>F</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>FinSmart India</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Features', 'About', 'Contact'].map(item => (
            <span key={item} style={{ fontSize: 14, color: '#666', cursor: 'pointer' }}>{item}</span>
          ))}
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60, padding: '60px 80px 40px', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>

        <div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#111', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-2px' }}>
            Master your money,<br />
            <span style={{ fontStyle: 'italic', fontWeight: 700 }}>confidently.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#777', margin: '0 0 36px', lineHeight: 1.6 }}>
            See your entire financial life clearly,<br />all in one place.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={l} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #f8f7f4', background: ['#111', '#16a34a', '#3b82f6', '#f97316'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, marginLeft: i === 0 ? 0 : -8 }}>{l}</div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              Join <strong style={{ color: '#111' }}>{stats.totalUsers > 0 ? `${stats.totalUsers}+` : 'thousands of'}</strong> Indians tracking finances
            </p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)', border: '1px solid #f0eeea' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
            {isRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 24px' }}>
            {isRegister ? 'Start tracking your finances today' : 'Sign in to your account'}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', border: '1.5px solid #e5e3df', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }}
              onFocus={e => e.target.style.borderColor = '#111'}
              onBlur={e => e.target.style.borderColor = '#e5e3df'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', border: '1.5px solid #e5e3df', borderRadius: 10, padding: '11px 40px 11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }}
                onFocus={e => e.target.style.borderColor = '#111'}
                onBlur={e => e.target.style.borderColor = '#e5e3df'}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#aaa', padding: 0 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#333' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#111' }}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account →' : 'Sign In →'}
          </button>

          <p onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{ textAlign: 'center', fontSize: 13, color: '#aaa', cursor: 'pointer', margin: 0 }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <span style={{ color: '#111', fontWeight: 600 }}>{isRegister ? 'Sign In' : 'Register'}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 80px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {[
          { value: stats.totalAmount > 0 ? formatAmount(stats.totalAmount) : '₹0', label: 'Total tracked', color: '#16a34a', sub: 'Real transactions' },
          { value: stats.totalUsers > 0 ? `${stats.totalUsers}+` : '0', label: 'Active users', color: '#3b82f6', sub: 'Registered accounts' },
          { value: stats.totalTransactions > 0 ? `${stats.totalTransactions}+` : '0', label: 'Transactions', color: '#f97316', sub: 'Entries logged' },
          { value: stats.avgRating > 0 ? `${stats.avgRating}★` : 'New', label: 'User rating', color: '#f59e0b', sub: 'Based on reviews' },
        ].map(stat => (
          <div key={stat.label}
            style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #f0eeea', transition: 'all 0.2s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{stat.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 2px' }}>{stat.label}</p>
            <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Login