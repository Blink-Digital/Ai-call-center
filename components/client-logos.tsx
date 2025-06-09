export function ClientLogos() {
  const logos = [
    { name: "Better", width: 100 },
    { name: "Twilio", width: 100 },
    { name: "Medallion", width: 100 },
    { name: "SendGrid", width: 100 },
    { name: "Networks", width: 100 },
    { name: "Clipboard", width: 100 },
    { name: "Nuitee", width: 100 },
    { name: "Data", width: 100 },
  ]

  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      {logos.map((logo, index) => (
        <div key={index} className="grayscale opacity-70 hover:opacity-100 transition-opacity">
          <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
            <span className="text-xs text-gray-600">{logo.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
