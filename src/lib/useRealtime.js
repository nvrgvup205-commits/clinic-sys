import { useEffect } from 'react'
import { supabase } from './supabase'

/**
 * Hook للاشتراك في Realtime updates
 */
export function useRealtime(table, callback, filter = null) {
  useEffect(() => {
    if (!table || !callback) return

    const channelName = `${table}-${Date.now()}-${Math.random()}`
    let subscription = supabase.channel(channelName)

    const config = {
      event: '*',
      schema: 'public',
      table: table
    }

    if (filter) {
      config.filter = `${filter.column}=eq.${filter.value}`
    }

    subscription = subscription
      .on('postgres_changes', config, (payload) => {
        callback(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [table, filter?.value])
}
