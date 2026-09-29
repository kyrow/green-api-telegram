import { createGreenApi, type GreenApiClient } from './greenApi'
import { createMockGreenApi } from './mockGreenApi'
import type { Credentials } from './types'

export { DEFAULT_API_URL, GreenApiError, type GreenApiClient } from './greenApi'
export type * from './types'

/** Мок-режим включается параметром `?mock=1` в адресе страницы. */
export const isMockMode = new URLSearchParams(window.location.search).get('mock') === '1'

export function createApiClient(credentials: Credentials): GreenApiClient {
  return isMockMode ? createMockGreenApi(credentials) : createGreenApi(credentials)
}
