'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const apiKeyFormSchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100),
  expires_in: z.enum(['30', '90', '365', '0'], {
    errorMap: () => ({ message: 'Please select an expiration period' }),
  }),
})

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>

interface CreateApiKeyFormProps {
  onSuccess: () => void
}

export function CreateApiKeyForm({ onSuccess }: CreateApiKeyFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: '',
      expires_in: '365',
    },
  })

  async function onSubmit(data: ApiKeyFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const result = await response.json()
      
      toast.success('API key created successfully')
      form.reset()
      onSuccess()

      // Show the full API key in a more prominent way
      setTimeout(() => {
        alert(`\u26a0\ufe0f Save this API key safely - it won't be shown again:\n\n${result.apiKey.key}\n\nThis can be used to access the WasteWise API programmatically.`)
      }, 500)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create API key')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="My API Key" 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expires_in"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="0">Never expires</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col space-y-2">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create API Key'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            The full API key will be shown once. Save it securely.
          </p>
        </div>
      </form>
    </Form>
  )
}