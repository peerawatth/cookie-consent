"use strict"

import axios from "axios"
import defaultOptions from "./default_options"

const DEFAULT_STATUS = null
const DEFAULT_ACCEPTED_CATEGORIES = []
export default class Cookie {
  constructor(cookieOptions) {
    this.cookieOptions = cookieOptions
    this.load()
  }

  dump() {
    const domain = location.hostname
    const categories = this.acceptedCategories
    const serialized = JSON.stringify({
      status: this.status,
      acceptedCategories: this.acceptedCategories.map(v => v.name)
    })

    categories.forEach(group => this.consent(group))

    this.set({ ...defaultOptions.cookie, domain }, serialized)
  }

  async consent(group) {
    const { form_id, message_id, project_id } = group
    const source = window.location.origin
    const subject_id = ''
    
    const url = `https://cmp-api.jfin.network/api/v1/consent`
    const data = {
      project_id,
      message_id,
      subject_id: subject_id,
      form_id,
      source,
      retention_until: "",
      email: "",
      note1: "",
      note2: "",
      signature: ""
    }

    const response = (await axios.post(url, data)).data
    console.log(response)
    // return response
  }

  set(cookie, serialized) {
    let cookieStr = cookie.name + "=" + serialized
  
    const expDate = new Date()
    const expDays = cookie.expiryDays
    const expHours = (typeof expDays !== "number"  ? 365 : expDays ) * 24
    expDate.setHours(expDate.getHours() + expHours)
    cookieStr += "; expires=" + expDate.toUTCString()

    cookieStr += "; path=/"
    cookieStr += (cookie.domain ? "; domain=" + cookie.domain : "")
    cookieStr += (cookie.secure ? "; secure" : "")
    cookieStr += (cookie.sameSite ? "; SameSite=" +  cookie.sameSite : "")

    document.cookie = cookieStr
  }

  load() {
    const existingConsent = this._getCookie('cookie_consent')
    
    if(existingConsent){
      const parsed = JSON.parse(existingConsent)
      this.status = parsed.status
      this.acceptedCategories = parsed.acceptedCategories
    } else {
      this.status = DEFAULT_STATUS
      this.acceptedCategories = DEFAULT_ACCEPTED_CATEGORIES
    }
  }

  _getCookie(cookieName) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${cookieName}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
}

// Make default values public.
Object.defineProperties(Cookie, {
  DEFAULT_STATUS: { value: DEFAULT_STATUS, writable: false },
  DEFAULT_ACCEPTED_CATEGORIES: { value: DEFAULT_ACCEPTED_CATEGORIES, writable: false }
})
