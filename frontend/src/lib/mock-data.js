export const locations = {
  OGGB: "OGGB",
  Library: "Library", 
  Quad: "Quad",
  "Science Centre": "Science Centre",
}

const items = [
  {
    id: "1",
    kind: "lost",
    category: "electronics",
    title: "Lost: Black iPhone 13",
    description: "Black iPhone with green case. Lock screen photo of mountains.",
    imageUrl: "/black-iphone-13-green-case.png",
    date: new Date().toISOString(),
    location: locations.OGGB,
    reporter: { name: "Guest User", trust: false },
  },
  {
    id: "2",
    kind: "found",
    category: "accessory",
    title: "Found: Blue water bottle",
    description: "Blue metal bottle with dent near cap.",
    imageUrl: "/placeholder-heiw4.png",
    date: new Date(Date.now() - 3600_000).toISOString(),
    location: locations.Quad,
    reporter: { name: "Nadia", trust: true },
  },
  {
    id: "3",
    kind: "lost",
    category: "card",
    title: "Lost: Student ID card",
    description: "UPI: abcd123, name: John D. Please contact.",
    imageUrl: "/student-id-card.png",
    date: new Date(Date.now() - 2 * 3600_000).toISOString(),
    location: locations.Library,
    reporter: { name: "Jerry", trust: true },
  },
  {
    id: "4",
    kind: "found",
    category: "apparel",
    title: "Found: Hoodie near Science Centre",
    description: "Grey hoodie size M with logo on sleeve.",
    imageUrl: "/grey-hoodie.png",
    date: new Date(Date.now() - 3 * 3600_000).toISOString(),
    location: locations["Science Centre"],
    reporter: { name: "Liam", trust: false },
  },
]

export function getItemsClient() {
  return items.map((i) => ({ 
    ...i, 
    reporter: { ...i.reporter }, 
    location: i.location 
  }))
}

export function getProfileItems() {
  return [
    // Items posted by the current user (Guest User)
    {
      id: "1",
      title: "Lost: Black iPhone 13",
      status: "Open",
      kind: "lost",
      category: "electronics",
      reporter: { name: "Guest User" },
      claims: [
        { id: "claim1", claimer: "John Doe", status: "pending", date: new Date(Date.now() - 86400000).toISOString() }
      ]
    },
    {
      id: "3",
      title: "Lost: Student ID Card",
      status: "Resolved", 
      kind: "lost",
      category: "card",
      reporter: { name: "Guest User" },
      claims: [
        { id: "claim2", claimer: "Sarah Kim", status: "approved", date: new Date(Date.now() - 172800000).toISOString() }
      ]
    },
    {
      id: "5",
      title: "Found: Blue Water Bottle",
      status: "Unclaimed",
      kind: "found", 
      category: "accessory",
      reporter: { name: "Guest User" },
      claims: []
    },
    // Items posted by others that current user has claimed
    {
      id: "2", 
      title: "Found: AirPods Pro",
      status: "Claimed",
      kind: "found",
      category: "electronics", 
      reporter: { name: "John Doe" },
      claims: [
        { id: "claim3", claimer: "Guest User", status: "pending", date: new Date(Date.now() - 43200000).toISOString() }
      ]
    },
    {
      id: "4",
      title: "Found: Grey Hoodie",
      status: "Resolved",
      kind: "found",
      category: "apparel",
      reporter: { name: "Mike Wilson" },
      claims: [
        { id: "claim4", claimer: "Guest User", status: "approved", date: new Date(Date.now() - 259200000).toISOString() }
      ]
    },
    {
      id: "6",
      title: "Found: Red Notebook",
      status: "Claimed",
      kind: "found", 
      category: "other",
      reporter: { name: "Emma Davis" },
      claims: [
        { id: "claim5", claimer: "Guest User", status: "rejected", date: new Date(Date.now() - 604800000).toISOString() }
      ]
    }
  ]
}
