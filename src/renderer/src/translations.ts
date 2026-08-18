import { loadLocale } from '../../i18n/i18n-util.sync'
import { i18nObject } from '../../i18n/i18n-util'
import type { Locales } from '../../i18n/i18n-types'
import { writable } from 'svelte/store'

const settings = await window.BananasApi.getSettings()

const locale = (settings?.language as Locales) || 'en'

loadLocale(locale)

const createTranslationStore = () => {
  const { subscribe, set } = writable(i18nObject(locale))

  return {
    subscribe,
    setLocale: (newLocale: Locales) => {
      loadLocale(newLocale)
      set(i18nObject(newLocale))
    }
  }
}

export const L = createTranslationStore()
