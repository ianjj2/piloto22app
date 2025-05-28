import { metadata, viewport } from './layout.metadata'
import ClientLayout from './layout-client'

export { metadata, viewport }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
} 
