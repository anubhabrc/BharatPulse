import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BharatPulse · India’s Company Field Guide',description:'Discover startups and product companies in India, with sourced offices, founders, careers, news and available funding history.'};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><head><link rel="preload" href="/fonts/space-grotesk-latin-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
