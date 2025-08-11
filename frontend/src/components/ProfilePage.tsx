import React, { useMemo } from "react"

// Mock data function
const getItemsClient = () => [
  {
    id: 1,
    title: "Lost iPhone 12",
    reporter: { name: "Guest User" }, 
    claims: [{ claimer: "John Doe" }],
    status: "Open"
  },
  {
    id: 2,
    title: "Found Wallet",
    reporter: { name: "Jane Smith" },
    claims: [{ claimer: "Guest User" }],
    status: "Claimed"
  }
]

// Mock UI components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  const variantClasses = variant === "outline" 
    ? "border border-gray-200 text-gray-700 bg-white"
    : "bg-gray-100 text-gray-800"
  
  return (
    <span className={`${baseClasses} ${variantClasses}`}>
      {children}
    </span>
  )
}

export default function ProfilePage() {
  const items = getItemsClient()
  const myName = "Guest User"
  const myPosts = useMemo(() => items.filter((i) => i.reporter.name === myName), [items])
  const myClaims = useMemo(() => items.filter((i) => i.claims.some((c) => c.claimer === myName)), [items])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M4 1a2.5 2.5 0 00-2.5 2.5v1.5L1 5.5a.5.5 0 00.5.5h5a.5.5 0 00.5-.5L6.5 5V3.5A2.5 2.5 0 004 1zM4 7a1 1 0 01-1-1h2a1 1 0 01-1 1z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">Lost & Found Community</span>
            </div>
           
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900">Feed</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Report</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Map</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Stats</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Notices</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Admin</a>
              <a href="#" className="text-blue-600 font-medium flex items-center">
                Profile
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Repo</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile & History</h1>
            <p className="text-gray-600 mt-2">
              Mock user context. Integrate UPI-backed SSO for identity and trust badges (A2).
            </p>
          </div>

          {/* Trust & Verification Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Trust & Verification
                <Badge variant="outline">Unverified</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Connect university SSO to verify identity and earn trust badges for faster claims and higher credibility.
            </CardContent>
          </Card>

          {/* Posts and Claims Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* My Posts Card */}
            <Card>
              <CardHeader>
                <CardTitle>My Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myPosts.length === 0 ? (
                  <p className="text-sm text-gray-500">No posts yet.</p>
                ) : (
                  myPosts.map((i) => (
                    <div key={i.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{i.title}</span>
                      <span className="text-green-600 font-medium">Open</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* My Claims Card */}
            <Card>
              <CardHeader>
                <CardTitle>My Claims</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myClaims.length === 0 ? (
                  <p className="text-sm text-gray-500">No claims yet.</p>
                ) : (
                  myClaims.map((i) => (
                    <div key={i.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{i.title}</span>
                      <span className="text-gray-500">{i.status}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
