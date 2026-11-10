import '@testing-library/jest-dom/vitest';
// jsdom has no <dialog> methods; give it the minimal behavior the Modal relies on.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); };
}
