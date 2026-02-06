'use client'

import { Button } from '@/components/ui/button'
import { notify } from '@/stores/useUIStore'

export function TestNotifications() {
  return (
    <div className="flex gap-2 p-4">
      <Button
        onClick={() => notify.success('Success!', 'Token created successfully')}
        className="bg-green-600 hover:bg-green-700"
      >
        Test Success
      </Button>
      <Button
        onClick={() => notify.error('Error!', 'Failed to create token')}
        className="bg-red-600 hover:bg-red-700"
      >
        Test Error
      </Button>
      <Button
        onClick={() => notify.warning('Warning!', 'Low balance detected')}
        className="bg-yellow-600 hover:bg-yellow-700"
      >
        Test Warning
      </Button>
      <Button
        onClick={() => notify.info('Info', 'Transaction pending...')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Test Info
      </Button>
    </div>
  )
}
