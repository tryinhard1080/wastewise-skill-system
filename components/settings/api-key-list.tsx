'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key_preview: string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
}

export function ApiKeyList({ onApiKeyCreated }: { onApiKeyCreated: () => void }) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('API key copied to clipboard')
    } catch (error) {
      console.error('Failed to copy API key:', error)
      toast.error('Failed to copy API key')
    }
  }

  async function regenerateApiKey(keyId: string) {
    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}/regenerate`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to regenerate key')
      toast.success('API key regenerated')
      fetchApiKeys()
    } catch (error) {
      console.error('Failed to regenerate API key:', error)
      toast.error('Failed to regenerate API key')
    }
  }

  async function deleteApiKey(keyId: string) {
    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete API key')
      toast.success('API key deleted')
      fetchApiKeys()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  useEffect(() => {
    if (onApiKeyCreated) {
      fetchApiKeys()
    }
  }, [onApiKeyCreated])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading API keys...</div>
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          You haven&apos;t created any API keys yet
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Create an API key to get started with programmatic access
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <Card key={apiKey.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{apiKey.name}</h4>
                  <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                    {apiKey.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {apiKey.key_preview}
                  </code>
                  <span>Created {formatDistanceToNow(new Date(apiKey.created_at), { addSuffix: true })}</span>
                  {apiKey.last_used_at && (
                    <span>
                      Last used {formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })}
                    </span>
                  )}
                  {apiKey.expires_at && (
                    <span>
                      Expires {formatDistanceToNow(new Date(apiKey.expires_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyToClipboard(apiKey.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Full Key
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => regenerateApiKey(apiKey.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteApiKey(apiKey.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
