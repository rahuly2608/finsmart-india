
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function Dashboard() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [active, setActive] = useState('home')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState({
    'Food & Dining': 5000,
    'Transport': 3000,
    'Shopping': 4000,
    'Entertainment': 2000,
    'Bills': 5000,
    'Other': 2000
  })

  useEffect(() => {
    const user = auth.currentUser
    if (!user) { navigate('/'); return }
    setUserName(user.email.split('@')[0])
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => new Date(b.date) - new Date(a.date))
      setTransactions(data)
      let inc = 0, exp = 0
      data.forEach(t => {
        if (t.type === 'income') inc += Number(t.amount)
        else exp += Number(t.amount)
      })
      setIncome(inc)
      setExpense(exp)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  async function deleteTransaction(id) {
    if (window.confirm('Delete this transaction?')) {
      await deleteDoc(doc(db, 'transactions', id))
    }
  }

  const categories = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Number(t.amount)
  })

  const catConfig = {
    'Food & Dining': { color: '#f97316', light: '#fff7ed', emoji: '🍽' },
    'Transport': { color: '#3b82f6', light: '#eff6ff', emoji: '🚗' },
    'Shopping': { color: '#a855f7', light: '#faf5ff', emoji: '🛍' },
    'Entertainment': { color: '#ec4899', light: '#fdf2f8', emoji: '🎬' },
    'Bills': { color: '#ef4444', light: '#fef2f2', emoji: '📄' },
    'Healthcare': { color: '#14b8a6', light: '#f0fdfa', emoji: '🏥' },
    'Income': { color: '#22c55e', light: '#f0fdf4', emoji: '💰' },
    'Other': { color: '#6b7280', light: '#f9fafb', emoji: '📦' },
  }

  const COLORS = ['#f97316', '#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#6b7280']

  const balance = income - expense
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  const incomeWidth = income + expense > 0 ? Math.round((income / (income + expense)) * 100) : 50
  const expenseWidth = 100 - incomeWidth

  const monthlyData = [
    { month: 'Oct', income: 0, expense: 0 },
    { month: 'Nov', income: 0, expense: 0 },
    { month: 'Dec', income: 0, expense: 0 },
    { month: 'Jan', income: 0, expense: 0 },
    { month: 'Feb', income: 0, expense: 0 },
    { month: 'Mar', income: income, expense: expense },
  ]

  const pieData = Object.entries(categories).map(([name, value]) => ({ name, value }))

  const navItems = [
    { id: 'home', label: 'Home', emoji: '⌂' },
    { id: 'budgets', label: 'Budgets', emoji: '◎' },
    { id: 'transactions', label: 'Transactions', emoji: '⇄' },
    { id: 'insights', label: 'Insights', emoji: '◈' },
  ]

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #111', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontWeight: 600, color: '#111' }}>FinSmart India</p>
          <p style={{ color: '#aaa', fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #f0eeea', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f0eeea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>F</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>FinSmart India</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px' }}>
          <p style={{ fontSize: 10, color: '#aaa', padding: '0 8px', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, marginBottom: 2, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: active === item.id ? '#111' : 'transparent', color: active === item.id ? '#fff' : '#666' }}
              onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = '#f5f4f1' }}
              onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 16 }}>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #f0eeea', padding: '12px 8px' }}>
          <button onClick={() => navigate('/add')}
            style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = '#333'}
            onMouseLeave={e => e.currentTarget.style.background = '#111'}>
            + Add Transaction
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0eeea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#555', flexShrink: 0 }}>
              {userName[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
              <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>Personal</p>
            </div>
            <button onClick={handleLogout} style={{ fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }} title="Logout">↩</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '32px', minHeight: '100vh' }}>

        {/* HOME */}
        {active === 'home' && (
          <motion.div {...fadeUp}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0 }}>Hello, {userName} 👋</h1>
                <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Net Worth Card */}
            <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 20, border: '1px solid #f0eeea', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 6px', fontWeight: 500 }}>Net Worth</p>
                  <p style={{ fontSize: 38, fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-1px' }}>
                    ₹{balance.toLocaleString('en-IN')}
                  </p>
                  <p style={{ fontSize: 12, color: savingsRate >= 0 ? '#16a34a' : '#dc2626', margin: '6px 0 0', fontWeight: 500 }}>
                    {savingsRate >= 0 ? '▲' : '▼'} {Math.abs(savingsRate)}% savings rate
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 32 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 4px' }}>Income</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', margin: 0 }}>₹{income.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{transactions.filter(t => t.type === 'income').length} transactions</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 4px' }}>Expenses</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', margin: 0 }}>₹{expense.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{transactions.filter(t => t.type === 'expense').length} transactions</p>
                  </div>
                </div>
              </div>

              {income > 0 || expense > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Income</span>
                      <span style={{ fontSize: 12, color: '#555' }}>₹{income.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${incomeWidth}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#16a34a', borderRadius: 4 }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#16a34a', margin: '3px 0 0', fontWeight: 500 }}>
                      {balance >= 0 ? `▲ ₹${balance.toLocaleString('en-IN')} saved` : `▼ ₹${Math.abs(balance).toLocaleString('en-IN')} deficit`}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Expenses</span>
                      <span style={{ fontSize: 12, color: '#555' }}>₹{expense.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${expenseWidth}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: expense > income ? '#dc2626' : '#6b7280', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Add transactions to see your financial overview</p>
              )}
            </motion.div>

            {/* Monthly Chart */}
            <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '20px 22px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Monthly Trend</h2>
                <span style={{ fontSize: 11, color: '#aaa', background: '#f8f7f4', padding: '3px 10px', borderRadius: 20 }}>Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeea" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f0eeea', borderRadius: 8, fontSize: 12 }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                  <Area type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }}></div>
                  <span style={{ fontSize: 11, color: '#aaa' }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
                  <span style={{ fontSize: 11, color: '#aaa' }}>Expenses</span>
                </div>
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>

              {/* Recent Transactions */}
              <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f8f7f4' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Recent Transactions</h2>
                  <button onClick={() => setActive('transactions')} style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                </div>
                {transactions.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: '#aaa', fontSize: 13 }}>No transactions yet</p>
                    <button onClick={() => navigate('/add')} style={{ marginTop: 8, fontSize: 12, color: '#111', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Add your first one</button>
                  </div>
                ) : (
                  transactions.slice(0, 6).map((t, i) => {
                    const cfg = catConfig[t.category] || catConfig['Other']
                    return (
                      <motion.div key={t.id} whileHover={{ background: '#f8f7f4' }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid #f8f7f4', cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {cfg.emoji}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{t.merchant || 'Unknown'}</p>
                            <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{t.category} • {new Date(t.date).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#16a34a' : '#111', margin: 0 }}>
                            {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                          </p>
                          <button onClick={() => deleteTransaction(t.id)}
                            style={{ fontSize: 12, color: '#ddd', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>✕</button>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </motion.div>

              {/* Pie Chart + Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '18px 20px' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 16px' }}>Spending Split</h2>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {pieData.slice(0, 4).map((entry, i) => (
                          <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                              <span style={{ fontSize: 11, color: '#555' }}>{entry.name}</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>₹{entry.value.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No spending data yet</p>
                  )}
                </motion.div>

                <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '18px 20px' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 14px' }}>Quick Stats</h2>
                  {[
                    { label: 'Total transactions', value: transactions.length },
                    { label: 'Savings rate', value: `${savingsRate}%`, color: savingsRate >= 0 ? '#16a34a' : '#dc2626' },
                    { label: 'Avg per expense', value: `₹${transactions.filter(t => t.type === 'expense').length > 0 ? Math.round(expense / transactions.filter(t => t.type === 'expense').length).toLocaleString('en-IN') : 0}` },
                    { label: 'Categories used', value: Object.keys(categories).length },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#aaa' }}>{stat.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: stat.color || '#111' }}>{stat.value}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Budget Quick View */}
            <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Budget Overview</h2>
                <button onClick={() => setActive('budgets')} style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {['Food & Dining', 'Transport', 'Shopping'].map(cat => {
                  const spent = transactions.filter(t => t.category === cat && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
                  const limit = budgets[cat] || 5000
                  const pct = Math.min((spent / limit) * 100, 100)
                  const cfg = catConfig[cat] || catConfig['Other']
                  return (
                    <div key={cat} style={{ padding: '12px 14px', borderRadius: 12, background: cfg.light }}>
                      <p style={{ fontSize: 11, fontWeight: 600, margin: '0 0 4px', color: cfg.color }}>{cat}</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>₹{spent.toLocaleString('en-IN')}</p>
                      <p style={{ fontSize: 10, color: '#aaa', margin: '0 0 8px' }}>of ₹{limit.toLocaleString('en-IN')}</p>
                      <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                          style={{ height: '100%', background: cfg.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* BUDGETS */}
        {active === 'budgets' && (
          <motion.div {...fadeUp}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>Budgets</h1>
              <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>Set limits and track your monthly spending</p>
            </div>

            <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0eeea' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 14px' }}>Monthly Overview</p>
              {[
                { label: 'Income', value: income, total: income + expense || 1, color: '#16a34a' },
                { label: 'Expenses', value: expense, total: income + expense || 1, color: expense > income ? '#dc2626' : '#6b7280' },
                { label: 'Savings', value: Math.max(income - expense, 0), total: income || 1, color: '#16a34a' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>₹{item.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((item.value / item.total) * 100, 100)}%` }} transition={{ duration: 1 }}
                      style={{ height: '100%', background: item.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'].map(cat => {
                const spent = transactions.filter(t => t.category === cat && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
                const limit = budgets[cat] || 5000
                const pct = Math.min((spent / limit) * 100, 100)
                const cfg = catConfig[cat] || catConfig['Other']
                const remaining = limit - spent
                return (
                  <motion.div key={cat} whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0eeea', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{cat}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: pct > 80 ? '#fef2f2' : pct > 50 ? '#fffbeb' : '#f0fdf4', color: pct > 80 ? '#dc2626' : pct > 50 ? '#d97706' : '#16a34a' }}>
                        {Math.round(pct)}% used
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>₹{spent.toLocaleString('en-IN')}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: '#aaa' }}>of ₹</span>
                        <input type="number" value={budgets[cat] || 5000}
                          onChange={e => setBudgets(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                          style={{ width: 64, border: '1px solid #e5e3df', borderRadius: 6, padding: '2px 6px', fontSize: 12, color: '#555', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                        style={{ height: '100%', background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : cfg.color, borderRadius: 4 }} />
                    </div>
                    <p style={{ fontSize: 11, color: remaining >= 0 ? '#aaa' : '#dc2626', margin: 0, fontWeight: remaining < 0 ? 600 : 400 }}>
                      {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : `⚠ ₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* TRANSACTIONS */}
        {active === 'transactions' && (
          <motion.div {...fadeUp}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>Transactions</h1>
                <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>{transactions.length} total transactions</p>
              </div>
              <button onClick={() => navigate('/add')}
                style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = '#111'}>
                + Add New
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', overflow: 'hidden' }}>
              {transactions.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <p style={{ color: '#aaa', fontSize: 14 }}>No transactions yet</p>
                  <button onClick={() => navigate('/add')} style={{ marginTop: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Add Transaction</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #f8f7f4' }}>
                    {['Merchant', 'Category', 'Date', 'Amount'].map(h => (
                      <p key={h} style={{ fontSize: 11, color: '#aaa', fontWeight: 600, margin: 0, textAlign: h === 'Amount' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
                    ))}
                  </div>
                  {transactions.map((t, i) => {
                    const cfg = catConfig[t.category] || catConfig['Other']
                    return (
                      <motion.div key={t.id} whileHover={{ background: '#f8f7f4' }}
                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid #f8f7f4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            {cfg.emoji}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{t.merchant || 'Unknown'}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: cfg.light, color: cfg.color, display: 'inline-block', width: 'fit-content' }}>{t.category}</span>
                        <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{new Date(t.date).toLocaleDateString('en-IN')}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#16a34a' : '#111', margin: 0 }}>
                            {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                          </p>
                          <button onClick={() => deleteTransaction(t.id)}
                            style={{ fontSize: 12, color: '#ddd', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>✕</button>
                        </div>
                      </motion.div>
                    )
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* INSIGHTS */}
        {active === 'insights' && (
          <motion.div {...fadeUp}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>Insights</h1>
              <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>Understand your spending patterns</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'Savings Rate', value: `${savingsRate}%`, sub: 'of total income', color: savingsRate >= 0 ? '#16a34a' : '#dc2626' },
                { label: 'Biggest Expense', value: transactions.filter(t => t.type === 'expense').length > 0 ? `₹${Math.max(...transactions.filter(t => t.type === 'expense').map(t => Number(t.amount))).toLocaleString('en-IN')}` : '₹0', sub: 'single transaction', color: '#111' },
                { label: 'Avg per Expense', value: `₹${transactions.filter(t => t.type === 'expense').length > 0 ? Math.round(expense / transactions.filter(t => t.type === 'expense').length).toLocaleString('en-IN') : 0}`, sub: 'per transaction', color: '#111' },
              ].map(stat => (
                <motion.div key={stat.label} whileHover={{ y: -3 }} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0eeea', padding: '20px 22px', cursor: 'default' }}>
                  <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: stat.color, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0eeea', padding: '20px 22px' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 18px' }}>Category Breakdown</h2>
                {Object.keys(categories).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                      const pct = Math.round((amt / expense) * 100)
                      const cfg = catConfig[cat] || catConfig['Other']
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{cat}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>₹{amt.toLocaleString('en-IN')}</span>
                              <span style={{ fontSize: 11, color: '#aaa' }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 6, background: '#f0eeea', borderRadius: 3, overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                              style={{ height: '100%', background: cfg.color, borderRadius: 3 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data yet</p>
                )}
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <motion.div whileHover={{ y: -2 }} style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '20px 22px' }}>
                  <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, margin: '0 0 6px' }}>Total Income</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#15803d', margin: '0 0 4px', letterSpacing: '-0.5px' }}>₹{income.toLocaleString('en-IN')}</p>
                  <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>{transactions.filter(t => t.type === 'income').length} transactions</p>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} style={{ background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca', padding: '20px 22px' }}>
                  <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, margin: '0 0 6px' }}>Total Expenses</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#b91c1c', margin: '0 0 4px', letterSpacing: '-0.5px' }}>₹{expense.toLocaleString('en-IN')}</p>
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{transactions.filter(t => t.type === 'expense').length} transactions</p>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0eeea', padding: '18px 22px' }}>
                  <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 4px' }}>Top Spending Category</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
                    {Object.keys(categories).length > 0 ? (
                      <span>{catConfig[Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)]?.emoji} {Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)}</span>
                    ) : 'No data yet'}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}

export default Dashboard