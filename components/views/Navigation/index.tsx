import React from 'react'
import Link from 'next/link'

const Navigation = (): React.JSX.Element => {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">Fluid Power Group</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className="px-3 py-2 hover:text-blue-600">Home</Link>
              <Link href="/hosebuilder" className="px-3 py-2 hover:text-blue-600">Hose Builder</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
