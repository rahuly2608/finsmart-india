
function Login() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        
        <h1 className="text-2xl font-bold text-center text-green-600 mb-2">
          FinSmart India
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Apna paisa, apni marzi
        </p>

        <input
          type="email"
          placeholder="Email daalo"
          className="w-full border p-3 rounded-lg mb-3 outline-none"
        />

        <input
          type="password"
          placeholder="Password daalo"
          className="w-full border p-3 rounded-lg mb-4 outline-none"
        />

        <button className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700">
          Login
        </button>

        <p className="text-center text-gray-500 mt-4 text-sm">
          Account nahi hai?
          <span className="text-green-600 cursor-pointer"> Register karo</span>
        </p>

      </div>
    </div>
  )
}

export default Login