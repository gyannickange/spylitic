import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="mobile-menu"
export default class extends Controller {
  static targets = ["menu", "btn"]

  toggle() {
    const isOpen = this.menuTarget.classList.toggle("is-open")
    this.btnTarget.classList.toggle("is-open", isOpen)
    this.btnTarget.setAttribute("aria-expanded", isOpen)
    this.menuTarget.setAttribute("aria-hidden", !isOpen)
  }

  close() {
    this.menuTarget.classList.remove("is-open")
    this.btnTarget.classList.remove("is-open")
    this.btnTarget.setAttribute("aria-expanded", false)
    this.menuTarget.setAttribute("aria-hidden", true)
  }
}
