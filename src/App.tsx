import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import TabBar from './components/TabBar'
import BulkSync from './tabs/BulkSync'
import DeepSwap from './tabs/DeepSwap'
import ShapeShadows from './tabs/ShapeShadows'
import ThePark from './tabs/ThePark'

type TabId = 'bulk-sync' | 'deep-swap' | 'shape-shadows' | 'the-park'

const TABS: { id: TabId; label: string }[] = [
  { id: 'bulk-sync', label: 'Bulk Sync' },
  { id: 'deep-swap', label: 'Deep Swap' },
  { id: 'shape-shadows', label: 'Shape Shadows' },
  { id: 'the-park', label: 'The Park' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('bulk-sync')

  const renderTab = () => {
    switch (activeTab) {
      case 'bulk-sync':
        return <BulkSync />
      case 'deep-swap':
        return <DeepSwap />
      case 'shape-shadows':
        return <ShapeShadows />
      case 'the-park':
        return <ThePark />
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />
      <main className="app-content">{renderTab()}</main>
    </div>
  )
}

export default App
