export interface ContactItem {
  label: string;
  text: string;
  href: string;
  external?: boolean;
  /** when set, a Copy button is shown and this value is copied */
  copy?: string;
}

export const CONTACTS: ContactItem[] = [
  { label: 'Email', text: 'sureshsk220305@gmail.com', href: 'mailto:sureshsk220305@gmail.com', copy: 'sureshsk220305@gmail.com' },
  { label: 'LinkedIn', text: 'linkedin.com/in/suresh-kumar-a', href: 'https://linkedin.com/in/suresh-kumar-a-2b529b367', external: true },
  { label: 'Portfolio', text: 'portfolio-beige-tau-cvheq67fx.vercel.app', href: 'https://portfolio-beige-tau-cvheq67fx.vercel.app', external: true },
  { label: 'GitHub', text: 'github.com/sureshsk2203', href: 'https://github.com/sureshsk2203', external: true },
  { label: 'Phone', text: '+91 97517 36476', href: 'tel:+919751736476', copy: '+91 97517 36476' },
];
