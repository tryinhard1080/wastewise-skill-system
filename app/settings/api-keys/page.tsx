'use client'

import { useState } from 'react'
import { ApiKeyList } from '@/components/settings/api-key-list'
import { CreateApiKeyForm } from '@/components/settings/create-api-key-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function ApiKeysPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access to WasteWise
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for programmatic access to WasteWise API
                  </DialogDescription>
                </DialogHeader>
                <CreateApiKeyForm 
                  onSuccess={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ApiKeyList onApiKeyCreated={() => setIsCreateDialogOpen(false)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p>
              API keys provide programmatic access to the WasteWise platform,
              allowing you to:
            </p>
            <ul>
              <li>Submit new analysis requests</li>
              <li>Retrieve analysis results</li>
              <li>Manage projects programmatically</li>
              <li>Access optimization insights</li>
            </ul>
            <p className="text-warning">
              <strong>Important:</strong> API keys are sensitive credentials.
              Keep them secure and never share them publicly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}