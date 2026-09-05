import { Chat } from './chat'
import { FileExplorer } from './file-explorer'
import { Header } from './header'
import { Logs } from './logs'
import { Preview } from './preview'
import { Sidebar } from '@/components/layout/sidebar'
import { TabContent, TabItem } from '@/components/tabs'
import { Welcome } from '@/components/modals/welcome'
import { cookies } from 'next/headers'
import { hideBanner } from '@/app/actions'

export default async function Page() {
  const store = await cookies()
  const banner = store.get('banner-hidden')?.value !== 'true'
  return (
    <>
      <Welcome defaultOpen={banner} onDismissAction={hideBanner} />
      <div className="flex flex-col h-screen max-h-screen overflow-hidden p-2 space-y-2">
        <Header className="flex items-center w-full shrink-0" />

        {/* Mobile: top tab strip */}
        <ul className="flex space-x-5 font-mono text-sm tracking-tight px-1 py-2 md:hidden">
          <TabItem tabId="chat">Chat</TabItem>
          <TabItem tabId="preview">Preview</TabItem>
          <TabItem tabId="file-explorer">File Explorer</TabItem>
          <TabItem tabId="logs">Logs</TabItem>
        </ul>

        {/* Mobile panels (one at a time, driven by ?tab= query) */}
        <div className="flex flex-1 w-full overflow-hidden md:hidden">
          <TabContent tabId="chat" className="flex-1 h-full overflow-hidden">
            <Chat className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent
            tabId="preview"
            className="flex-1 h-full overflow-hidden"
          >
            <Preview className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent
            tabId="file-explorer"
            className="flex-1 h-full overflow-hidden"
          >
            <FileExplorer className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="logs" className="flex-1 h-full overflow-hidden">
            <Logs className="flex-1 overflow-hidden" />
          </TabContent>
        </div>

        {/* Desktop: left icon sidebar + full-width active panel */}
        <div className="hidden md:flex flex-1 w-full min-h-0 overflow-hidden">
          <Sidebar />
          <div className="flex-1 min-h-0 overflow-hidden">
            <TabContent
              tabId="chat"
              className="flex-1 h-full overflow-hidden"
            >
              <Chat className="flex-1 overflow-hidden" />
            </TabContent>
            <TabContent
              tabId="preview"
              className="flex-1 h-full overflow-hidden"
            >
              <Preview className="flex-1 overflow-hidden" />
            </TabContent>
            <TabContent
              tabId="file-explorer"
              className="flex-1 h-full overflow-hidden"
            >
              <FileExplorer className="flex-1 overflow-hidden" />
            </TabContent>
            <TabContent
              tabId="logs"
              className="flex-1 h-full overflow-hidden"
            >
              <Logs className="flex-1 overflow-hidden" />
            </TabContent>
          </div>
        </div>
      </div>
    </>
  )
}