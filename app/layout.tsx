import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'МС · Retention',description:'Математикалық сауаттылық ағымдары, кураторлар нәтижесі және тәжірибе алмасу'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="kk"><body>{children}</body></html>}
