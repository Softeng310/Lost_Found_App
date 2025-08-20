// Mock data for announcements
export const announcements = [
  {
    id: '1',
    title: 'Welcome to the Lost & Found App!',
    content: 'Stay tuned for important updates and campus-wide announcements here.',
    date: '2025-08-15',
    author: 'Admin',
  },
  {
    id: '2',
    title: 'New Feature: Item Heatmap',
    content: 'You can now view a heatmap of lost and found items on campus. Check it out on the map page!',
    date: '2025-08-17',
    author: 'Admin',
  },
  {
    id: '3',
    title: 'Reminder: Keep Your Valuables Safe',
    content: 'Please remember to keep your belongings secure and report any lost or found items promptly.',
    date: '2025-08-19',
    author: 'Campus Security',
  },
];

export function getAnnouncements() {
  return announcements;
}
