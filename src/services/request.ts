import * as tough from 'tough-cookie-no-native'
import * as qs from 'qs'

export const API_BASE_URL = 'http://music.163.com'

const cookieJar = new tough.CookieJar()

const defaultHeaders = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip,deflate,sdch',
  'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
  'Connection': 'keep-alive',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'music.163.com',
  'Referer': 'http://music.163.com/',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:39.0) Gecko/20100101 Firefox/39.0'
}

export function getCookies () {
  return cookieJar.getCookieStringSync(API_BASE_URL)
}

export function setCookies (cookie: string): void {
  cookieJar.setCookieSync(cookie, API_BASE_URL)
}

export function getCsrfFromCookies (): string | null {
  const csrfReg = /csrf=(\w*);/.exec(getCookies())
  return csrfReg ? csrfReg[1] : null
}

function checkStatusFilter (response: IResponse) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    let error = new Error(response.statusText)
    error.name = 'http'
    throw error
  }
}

function parseJSONFilter (response: IResponse) {
  return response.text()
    .then(text => text.startsWith('<!DOCTYPE html>') ?
      text :
      JSON.parse(text)
    )
}

function setCookiesFilter (response: IResponse) {
  const cookies = response.headers.getAll('set-cookie')
  if (cookies.length) {
    cookies.forEach(setCookies)
  }
  return response
}

function get (
  uri: string
): Promise<any> {
  return fetch(API_BASE_URL + uri, {
    headers: Object.assign({}, defaultHeaders, {
      'Cookie': getCookies()
    })
  })
  .then(checkStatusFilter)
  .then(setCookiesFilter)
  .then(parseJSONFilter)
}

function post (
  uri: string,
  body: {}
): Promise<any>  {
  return fetch(API_BASE_URL + uri, {
    body: qs.stringify(body),
    headers: Object.assign({}, defaultHeaders, {
      'Cookie': getCookies()
    }),
    method: 'POST'
  })
  .then(checkStatusFilter)
  .then(setCookiesFilter)
  .then(parseJSONFilter)
}

export const request = {
  get,
  post
}