import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'BharatPulse Geo · Indian Startup Funding',description:'Explore source-linked Indian startup funding records from the Backstage with Millionaires Notion archive.'};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
