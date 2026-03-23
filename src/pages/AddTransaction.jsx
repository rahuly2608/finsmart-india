import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

const INDIAN_MERCHANTS = {
  'swiggy': 'Food & Dining',
  'zomato': 'Food & Dining',
  'dominos': 'Food & Dining',
  'mcdonalds': 'Food & Dining',
  'kfc': 'Food & Dining',
  'haldirams': 'Food & Dining',
  'blinkit': 'Food & Dining',
  'bigbasket': 'Food & Dining',
  'uber': 'Transport',
  'ola': 'Transport',
  'rapido': 'Transport',
  'irctc': 'Transport',
  'redbus': 'Transport',
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'meesho': 'Shopping',
  'nykaa': 'Shopping',
  'ajio': 'Shopping',
  'netflix': 'Entertainment',
  'spotify': 'Entertainment',
  'hotstar': 'Entertainment',
  'youtube': 'Entertainment',
  'bookmyshow': 'Entertainment',
  'jio': 'Bills',
  'airtel': 'Bills',
  'vodafone': 'Bills',
  'bsnl': 'Bills',
  'mseb': 'Bills',
  'bescom': 'Bills',
  'electricity': 'Bills',
  'salary': 'Income',
  'stipend': 'Income',
  'credited': 'Income',
  'freelance': 'Income',
  'practo': 'Healthcare',
  'apollo': 'Healthcare',
  'medplus': 'Healthcare',
  'pharmacy': 'Healthcare',
}

function getKeywordCategory(merchant) {
  const lower = merchant.toLowerCase()
  for (const [keyword, category] of Object.entries(INDIAN_MERCHANTS)) {
    if (lower.includes(keyword)) return category
  }
  return null
}

async function getGeminiParse(smsText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `You are an Indian bank SMS parser. Parse this SMS and return ONLY a JSON object with these fields:
- amount: number only (no currency symbol)
- merchant: merchant or company name (string)
- category: one of [Food & Dining, Transport, Shopping, Entertainment, Bills, Income, Healthcare, Other]
- type: "expense" or "income"

SMS: "${smsText}"

Return ONLY valid JSON, no explanation. Example:
{"amount": 450, "merchant": "Swiggy", "category": "Food & Dining", "type": "expense"}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.log('Gemini error:', e)
    return null
  }
}

function parseWithRegex(text) {
  const amountPatterns = [
    /Rs[\.:\s]\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i,
    /INR\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i,
    /Rupees\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i,
    /debited\s+(?:with\s+)?Rs?[\.:\s]\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i,
    /for\s+Rs?[\.:\s]\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i,
    /(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:Rs|INR)/i,
  ]

  const merchantPatterns = [
    /(?:to|at)\s+([A-Za-z0-9\s&]+?)(?:\s+on|\s+via|\s+ref|\.|,|$)/i,
    /(?:paid to)\s+([A-Za-z0-9\s&]+?)(?:\s+on|\s+via|\s+ref|\.|,|$)/i,
    /VPA\s+([A-Za-z0-9@.\-]+)/i,
  ]

  let amount = null
  let merchant = null

  for (const p of amountPatterns) {
    const m = text.match(p)
    if (m) { amount = m[1].replace(/,/g, ''); break }
  }

  for (const p of merchantPatterns) {
    const m = text.match(p)
    if (m && m[1].trim().length > 1) { merchant = m[1].trim(); break }
  }

  const isCredit = /credit|received|added|refund/i.test(text)
  return { amount, merchant, type: isCredit ? 'income' : 'expense' }
}

function AddTransaction() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('Food & Dining')
  const [type, setType] = useState('expense')
  const [smsText, setSmsText] = useState('')
  const [success, setSuccess] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)

  async function parseSMS() {
    if (!smsText.trim()) { alert('Please paste your SMS first!'); return }
    setParsing(true)
    setAiUsed(false)

    const regexResult = parseWithRegex(smsText)

    if (regexResult.amount && regexResult.merchant && regexResult.merchant.length > 3) {
      const cat = getKeywordCategory(regexResult.merchant)
      setAmount(regexResult.amount)
      setMerchant(regexResult.merchant)
      setType(regexResult.type)
      if (cat) setCategory(cat)
      setParsing(false)
      return
    }

    setAiUsed(true)
    const aiResult = await getGeminiParse(smsText)

    if (aiResult) {
      if (aiResult.amount) setAmount(String(aiResult.amount))
      if (aiResult.merchant) setMerchant(aiResult.merchant)
      if (aiResult.type) setType(aiResult.type)
      if (aiResult.category) setCategory(aiResult.category)
      if (aiResult.merchant) {
        const cat = getKeywordCategory(aiResult.merchant)
        if (cat) setCategory(cat)
      }
    } else {
      if (regexResult.amount) setAmount(regexResult.amount)
      if (regexResult.merchant) setMerchant(regexResult.merchant)
      setType(regexResult.type)
      alert('Could not fully parse. Please fill remaining fields manually.')
    }

    setParsing(false)
  }

  function handleMerchantChange(val) {
    setMerchant(val)
    const cat = getKeywordCategory(val)
    if (cat) setCategory(cat)
  }

  async function saveTransaction() {
    if (!amount || !merchant) { alert('Please enter amount and merchant!'); return }
    const user = auth.currentUser
    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      amount: Number(amount),
      merchant,
      category,
      type,
      date: new Date().toISOString()
    })
    setSuccess(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #f0eeea', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', padding: 0 }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>Add Transaction</h1>
        {aiUsed && (
          <span style={{ background: '#eff6ff', color: '#3b82f6', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            ✨ AI Powered
          </span>
        )}
      </div>

      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 20px' }}>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ color: '#16a34a', fontWeight: 600, margin: 0 }}>✓ Transaction saved! Redirecting...</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💬</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Paste UPI SMS</p>
              <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>AI + Smart parsing — works with any Indian bank</p>
            </div>
          </div>

          <textarea
            placeholder={'Paste your bank SMS here...\n\nExample: Rs.450 debited to Swiggy via UPI'}
            style={{ width: '100%', border: '1.5px solid #e5e3df', borderRadius: 10, padding: '12px 14px', fontSize: 13, outline: 'none', height: 90, resize: 'none', boxSizing: 'border-box', background: '#fafaf9', fontFamily: 'inherit', color: '#333', lineHeight: 1.6 }}
            value={smsText}
            onChange={e => setSmsText(e.target.value)}
            onFocus={e => e.target.style.borderColor = '#111'}
            onBlur={e => e.target.style.borderColor = '#e5e3df'}
          />

          <button onClick={parseSMS}
            disabled={parsing}
            style={{ width: '100%', background: parsing ? '#6b7280' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: parsing ? 'not-allowed' : 'pointer', marginTop: 10 }}>
            {parsing ? '🤖 AI Parsing...' : '⚡ Parse SMS with AI'}
          </button>

          {parsing && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', margin: '8px 0 0' }}>
              Asking Gemini AI to understand your SMS...
            </p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0eeea', padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 16px' }}>Transaction Details</p>

          <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4, marginBottom: 16 }}>
            {['expense', 'income'].map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: type === t ? '#fff' : 'transparent', color: type === t ? (t === 'income' ? '#16a34a' : '#dc2626') : '#aaa', boxShadow: type === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {t === 'expense' ? '↑ Expense' : '↓ Income'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#aaa', fontWeight: 600 }}>₹</span>
              <input type="number" placeholder="0"
                style={{ width: '100%', border: '1.5px solid #e5e3df', borderRadius: 10, padding: '11px 14px 11px 30px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onFocus={e => e.target.style.borderColor = '#111'}
                onBlur={e => e.target.style.borderColor = '#e5e3df'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Merchant
              <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 6 }}>— category auto selects!</span>
            </label>
            <input type="text" placeholder="e.g. Swiggy, Amazon, Salary"
              style={{ width: '100%', border: '1.5px solid #e5e3df', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }}
              value={merchant}
              onChange={e => handleMerchantChange(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#111'}
              onBlur={e => e.target.style.borderColor = '#e5e3df'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Food & Dining', emoji: '🍽' },
                { label: 'Transport', emoji: '🚗' },
                { label: 'Shopping', emoji: '🛍' },
                { label: 'Entertainment', emoji: '🎬' },
                { label: 'Bills', emoji: '📄' },
                { label: 'Healthcare', emoji: '🏥' },
                { label: 'Income', emoji: '💰' },
                { label: 'Other', emoji: '📦' },
              ].map(cat => (
                <button key={cat.label} onClick={() => setCategory(cat.label)}
                  style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${category === cat.label ? '#111' : '#e5e3df'}`, background: category === cat.label ? '#111' : '#fff', color: category === cat.label ? '#fff' : '#555', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveTransaction}
            style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#333'}
            onMouseLeave={e => e.currentTarget.style.background = '#111'}>
            Save Transaction →
          </button>
        </div>

        <button onClick={() => navigate('/dashboard')}
          style={{ width: '100%', background: 'transparent', color: '#aaa', border: '1px solid #e5e3df', borderRadius: 12, padding: 12, fontSize: 13, cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>

      </div>
    </div>
  )
}

export default AddTransaction
