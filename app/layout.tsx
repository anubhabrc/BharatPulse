import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BharatPulse Geo · Indian Startup Funding',description:'Explore source-linked Indian startup funding records from the Backstage with Millionaires Notion archive.'};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><head><link rel="preload" href="/fonts/space-grotesk-latin-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
