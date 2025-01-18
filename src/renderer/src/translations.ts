import { loadLocale } from '../../i18n/i18n-util.sync'
import { i18nObject } from '../../i18n/i18n-util'
import type { Locales } from '../../i18n/i18n-types'

const settings = await window.BananasApi.getSettings()

const locale = (settings?.language as Locales) || 'en'

loadLocale(locale)
export const L = i18nObject(locale)
