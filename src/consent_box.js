"use strict"

import consentBoxHtml from "./consent_box.html"
import Checkbox from "./checkbox"
import Observable from "./observable"

export default class ConsentBox extends Observable {
  constructor( options = {} ){
    super()

    this.options = options
    this.categories = this.options.categories

    this._build()

    document.body.appendChild(this.container)
  }

  open(){
    this.container.classList.add("displayed");
  }

  close(){
    this.container.classList.remove("displayed");
  }

  selectedCategories(){
    const categoriesElem = this._firstByClass("cc-categories")
    const selectedCategories = []

    for (let catKey in this.categories) {
      const catElem = categoriesElem.querySelector(
        "[data-category='" + catKey + "']"
      )
      if(catElem.getAttribute("aria-checked") == "true") {
        selectedCategories.push(catKey)
      }
    }

    return selectedCategories
  }

  _build(){
    // Build container & content
    const elemBuilder = document.createElement("div")
    elemBuilder.innerHTML = consentBoxHtml
    this.container = elemBuilder.firstChild

    if(this.options.background) {
      this._firstByClass("cc-box").style.background = this.options.background
    }

    if(this.options.color) {
      this.container.style.color = this.options.color
    }

    this._firstByClass("cc-title").innerHTML = this.options.title;
    this._firstByClass("cc-description").innerHTML = this.options.description;
    this._firstByClass("cc-btn-accept-all").innerHTML = this.options.buttons.acceptAll;
    this._firstByClass("cc-btn-accept-selected").innerHTML = this.options.buttons.acceptSelected;
    this._firstByClass("cc-btn-show-settings").innerHTML = this.options.buttons.showSettings;
    this._firstByClass("cc-btn-hide-settings").innerHTML = this.options.buttons.hideSettings;

    const rejectBtns = this._allByClass("cc-btn-reject")
    for(let i=0; i < rejectBtns.length; i++){
      rejectBtns[i].innerHTML = this.options.buttons.reject;
    }

    this._buildCategories()
    this._setupButtons()
  }

  _buildCategories(){
    const categoriesElem = this._firstByClass("cc-categories")

    for (let catKey in this.categories) {
      let key = catKey.toLowerCase().replace(/\s+/g, '-').trim()
      const category = this.categories[catKey]

      const categoryElem = document.createElement("div")
      categoryElem.setAttribute("data-category", key)
      categoryElem.setAttribute("role", "checkbox")
      categoryElem.setAttribute("tabindex", "0")

      const categoryLbl = document.createElement("span")
      categoryLbl.setAttribute("data-category", key)
      categoryLbl.setAttribute("role", "link")
      categoryLbl.setAttribute("tabindex", "0")
      const lblNode = document.createTextNode(category.label)
      categoryLbl.appendChild(lblNode)

      categoryElem.appendChild(categoryLbl)

      categoriesElem.appendChild(categoryElem)

      categoryElem.addEventListener("click", this._categoryClicked.bind(this))

      if (category.checked) {
        categoryElem.setAttribute("aria-checked", "true")
        this._categoryClicked({target: categoryElem})
      }
      if (category.mandatory) {
        categoryElem.setAttribute("aria-disabled", "true")
      }
    }

    this._initCheckBoxes();
  }

  _initCheckBoxes() {
    const checkboxes = this.container.querySelectorAll("[role='checkbox']");
    for (let i = 0; i < checkboxes.length; i++) {
      new Checkbox(checkboxes[i]).init();
    }
  }

  _categoryClicked(event) {
    const targetElement = event.target || event.srcElement;
    const targetCatKey = targetElement.dataset.category

    const descElem = this._firstByClass("cc-category-description")
    descElem.innerHTML = this.categories[targetCatKey].description
  }

  _setupButtons() {
    // Settings buttons
    this.container.querySelectorAll(".cc-btn-settings")
                  .forEach((elem) => {
      elem.addEventListener("click", this._toggleSettings.bind(this))
    })

    // Accept buttons
    this.container.querySelectorAll(".cc-btn-accept-all")
        .forEach((elem) => {
      elem.addEventListener("click", () => this.emit("accept-all"))
    })
    this.container.querySelectorAll(".cc-btn-accept-selected")
                  .forEach((elem) => {
      elem.addEventListener("click", () => this.emit("accept-selected"))
    })

    // Reject buttons
    this.container.querySelectorAll(".cc-btn-reject")
                  .forEach((elem) => {
      elem.addEventListener("click", () => this.emit("reject"))
    })
  }

  _toggleSettings() {
    const landingClassList = this._firstByClass("cc-section-landing").classList;
    const settingsClassList = this._firstByClass("cc-section-settings").classList;

    if(landingClassList.contains("cc-hidden")) {
      landingClassList.remove("cc-hidden")
      settingsClassList.add("cc-hidden")
    } else {
      landingClassList.add("cc-hidden")
      settingsClassList.remove("cc-hidden")
    }
  }


  _firstByClass(className){
    return this._allByClass(className)[0]
  }

  _allByClass(className){
    const elems = this.container.getElementsByClassName(className)
    if (elems.length > 0) { return elems }

    throw "Cannot find elements for class " + className + ".";
  }
}