"use strict"

import axios from 'axios'
import EventEmitter from "events"

import defaultOptions from "./default_options"
import ConsentBox from "./consent_box"
import Cookie from "./cookie"
import Observable from "./observable"

// There is only one event source which is shared between
// instance and class. Emit is only accesible at the instance
// level however.
const SharedEmitter = new EventEmitter()

export default class CookieConsent extends Observable {
  constructor( options = {} ) {
    // Since there must only be one instance (one consent box),
    // we will indicate user that it is not OK to create many
    // instances. Because of the option Object that may vary,
    // we cannot just return original instance, users would be
    // confused.
    if (CookieConsent._instance) {
      console.warn("CookieConsent already created, returning the original instance.")
      return CookieConsent._instance
    }

    super(CookieConsent._emitter)
    CookieConsent._instance = this

    let title = "We use cookies"
    let description = "Click “Accept” to enable us to use cookies to personalize this site. Customize your preferences in your Cookie Settings or click “Reject” if you do not want us to use cookies for this purpose. Learn more in our <a href=\"/cookies\">Cookie Notice</a>."

    const getSite = async () => {
      const uuid = document.querySelector('script[data-domain-script]').getAttribute('data-domain-script')
      const url = `https://cmp-api.jfin.network/api/v1/site/${uuid}`
      const response = await axios.get(url)

      return response.data.data.result
    }

    getSite().then((value) => {
      title = value.site.title
      description = value.site.description

      const categories = {}

      value.groups.forEach(element => {
        const title = element.title.toLowerCase().replace(/\s+/g, '-').trim()

        categories[title] = {
          checked: true,
          cookies: element.cookies.map(v => ({ name: v.title })),
          description: element.detail,
          form_id: element.form_id,
          label: element.title,
          mandatory: false,
          message_id: element.message_id,
          project_id: element.project_id
        }
      })

      if(value.site.background) {
        defaultOptions.background = value.site.background
      }

      if(value.site.color) {
        defaultOptions.color = value.site.color
      }
      
      this.options = Object.assign({ ...defaultOptions, title, description, categories }, options)
      this._consentBox = new ConsentBox(this.options)
      this._cookie = new Cookie(this.options.cookie)
  
      this._consentBox.on("accept-all", () => {
        const categories = Object.keys(this.options.categories).map(v => {
          return {
            cookies: this.options.categories[v].cookies,
            form_id: this.options.categories[v].form_id,
            message_id: this.options.categories[v].message_id,
            project_id: this.options.categories[v].project_id,
            name: v
          }
        })

        this._consentBox.close()
        this._cookie.status = "accepted"
        this._cookie.acceptedCategories = categories
        this._cookie.dump()
        this.emit("accept")
        this.emit("change")
      })
  
      this._consentBox.on("accept-selected", () => {
        const categories = this._consentBox.selectedCategories().map(v => {
          return {
            cookies: this.options.categories[v].cookies,
            form_id: this.options.categories[v].form_id,
            message_id: this.options.categories[v].message_id,
            project_id: this.options.categories[v].project_id,
            name: v
          }
        })
        
        this._consentBox.close()
        this._cookie.status = "accepted"
        this._cookie.acceptedCategories = categories
        this._cookie.dump()
        this.emit("accept")
        this.emit("change")
      })
  
      this._consentBox.on("reject", () => {
        this._consentBox.close()
        this._cookie.status = "rejected"
        this._cookie.acceptedCategories = []
        this._cookie.dump()
        this.emit("reject")
        this.emit("change")
      })
  
      if (!this._cookie.status) {
        this._consentBox.open()
      }
    })
  }

  open () {
    this._consentBox.open()
  }

  emit (event) {
    super.emit(event, this)
  }

  get status () {
    return this._cookie.status
  }

  get acceptedCategories () {
    return this._cookie.acceptedCategories
  }
}

// Static level properties, since class level static properties are still a
// proposal, we use Object.defineProperties.
Object.defineProperties(CookieConsent, {
  open: {
    value() {
      if (!this._instance) throw new Error("You must initialize a CookieConsent instance before opening.")

      this._instance.open()
    }
  },
  status: {
    get() { return this._instance ? this._instance.status : Cookie.DEFAULT_STATUS }
  },
  acceptedCategories: {
    get() { return this._instance ? this._instance.acceptedCategories : Cookie.DEFAULT_ACCEPTED_CATEGORIES }
  },
  on: {
    value: SharedEmitter.on.bind(SharedEmitter)
  }
})
