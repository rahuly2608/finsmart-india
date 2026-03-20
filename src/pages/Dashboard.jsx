
function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      <h1 className="text-2xl font-bold text-green-600 mb-6">
        FinSmart India
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total Balance</p>
          <p className="text-2xl font-bold text-green-600">₹6,500</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Income</p>
          <p className="text-2xl font-bold text-blue-600">₹10,000</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Expenses</p>
          <p className="text-2xl font-bold text-red-500">₹3,500</p>
        </div>

      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        
        <div className="flex justify-between items-center py-3 border-b">
          <div>
            <p className="font-medium">Swiggy</p>
            <p className="text-sm text-gray-500">Food & Dining</p>
          </div>
          <p className="text-red-500 font-semibold">-₹450</p>
        </div>

        <div className="flex justify-between items-center py-3 border-b">
          <div>
            <p className="font-medium">Salary</p>
            <p className="text-sm text-gray-500">Income</p>
          </div>
          <p className="text-green-600 font-semibold">+₹10,000</p>
        </div>

        <div className="flex justify-between items-center py-3 border-b">
          <div>
            <p className="font-medium">Uber</p>
            <p className="text-sm text-gray-500">Transport</p>
          </div>
          <p className="text-red-500 font-semibold">-₹200</p>
        </div>

        <div className="flex justify-between items-center py-3">
          <div>
            <p className="font-medium">Amazon</p>
            <p className="text-sm text-gray-500">Shopping</p>
          </div>
          <p className="text-red-500 font-semibold">-₹999</p>
        </div>

      </div>

      <button className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold hover:bg-green-700">
        + Transaction Add Karo
      </button>

    </div>
  )
}

export default Dashboard