export interface Project {
  n: string;
  img: string;
  url: string;
  tag: string;
  chips: string[];
  d: string;
  contain?: boolean;
}

export const PROJECTS: Project[] = [
  { n: 'Neo Dental Care', img: '/img/neo.jpg', url: 'https://dental-neo.vercel.app', tag: 'Client website', chips: ['Dental hospital', 'Responsive', 'Live'], d: 'Website for a dental hospital. Patients browse treatments, meet the doctor, see facilities and results, and book an appointment.' },
  { n: 'Rehoboth Refrigeration Hub', img: '/img/rehoboth.jpg', url: 'https://rehobothrefrigerationhub.online', tag: 'Business website', chips: ['React.js', 'Responsive', 'Live'], d: 'Online catalogue for original AC, fridge and washing machine spare parts, with categories, services and service areas.' },
  { n: 'StockPulse', img: '/img/stock.jpg', url: 'https://stock-kappa-lemon.vercel.app', tag: 'Web app', chips: ['Live news', 'Sector impact', 'Watchlist'], d: 'Market dashboard that scores news by sentiment, tracks sector impact on a live board and keeps a personal watchlist.' },
  { n: 'Sri Siddhi Vinayagar Temple', img: '/img/temple.jpg', url: 'https://vinayagartempleambasamudram.netlify.app', tag: 'Web application', chips: ['Tamil UI', 'Dashboard', 'Admin'], d: 'Temple site for Ambasamudram with a donations, vari (tax) and expenses dashboard behind an admin login.' },
  { n: 'Theerthapathi School', img: '/img/school.jpg', url: 'https://www.thsschool.com/', tag: 'School website', chips: ['React.js', 'Responsive', 'Live'], d: 'Website for a 140-year-old higher secondary school covering academics, facilities, staff, gallery and events.' },
  { n: 'INMBA', img: '/img/inmba.jpg', url: 'https://inmba.org/', tag: 'Company website', chips: ['React.js', 'Responsive', 'Membership'], d: 'Corporate site for the INMBA chamber, commercial and foundation divisions, with shopping, downloads and member login.' },
  { n: 'Swift Pay', img: '/img/swiftpay.jpg', url: '', tag: 'UI/UX concept', chips: ['Figma', 'Mobile', 'User flows'], d: 'Mobile payment concept designed in Figma. Send, receive, scan and history flows around a clear balance card.', contain: true },
];
