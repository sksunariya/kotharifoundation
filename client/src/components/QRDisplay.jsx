const QRDisplay = ({ qrCode, upiId, upiDisplayName, amount, bookingRef }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <h3 className="font-semibold text-gray-800 text-center mb-4">Scan to Pay via UPI</h3>

      <div className="flex justify-center mb-4">
        {qrCode ? (
          <img
            src={qrCode}
            alt="UPI QR Code"
            className="w-48 h-48 rounded-lg shadow-md border-4 border-white"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">QR Code Loading...</span>
          </div>
        )}
      </div>

      <div className="text-center space-y-1 mb-4">
        <p className="text-sm text-gray-600">Pay to: <span className="font-semibold text-gray-800">{upiDisplayName}</span></p>
        <p className="text-xs text-gray-500 font-mono bg-white rounded-md px-3 py-1 inline-block">{upiId}</p>
        <p className="text-lg font-bold text-primary-700">₹{amount?.toLocaleString('en-IN')}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">⚠️ Important Instructions:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Scan QR code using any UPI app (GPay, PhonePe, Paytm)</li>
          <li>Enter amount ₹{amount?.toLocaleString('en-IN')} if not auto-filled</li>
          <li>Use reference: <span className="font-mono font-semibold">{bookingRef}</span></li>
          <li>Save the transaction screenshot</li>
          <li>Submit your UTR number and screenshot below</li>
        </ol>
      </div>
    </div>
  );
};

export default QRDisplay;
