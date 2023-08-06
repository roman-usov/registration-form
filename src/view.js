import { errorMessages } from './application';

export function addHandlerForInputs(model, handler) {
  const formContainerEl = document.querySelector('[data-container="sign-up"]');
  formContainerEl?.addEventListener('blur', handler.bind(null, model), true);
  formContainerEl?.addEventListener('input', handler.bind(null, model));
}

export function addHandlerForSubmit(model, handler) {
  const formEl = document.querySelector('[data-form="sign-up"]');
  formEl?.addEventListener('submit', handler.bind(null, model));
}

export const renderConfig = {
  name: {
    selector: '[name="name"]',
    inputErrorClass: 'is-invalid',
    errorElementSelector: '.invalid-feedback',
    errorElementClass: 'invalid-feedback',
    action: 'renderInput',
    errorAction: 'renderInputError',
  },
  email: {
    selector: '[name="email"]',
    inputErrorClass: 'is-invalid',
    errorElementSelector: '.invalid-feedback',
    errorElementClass: 'invalid-feedback',
    action: 'renderInput',
    errorAction: 'renderInputError',
  },
  password: {
    selector: '[name="password"]',
    inputErrorClass: 'is-invalid',
    errorElementSelector: '.invalid-feedback',
    errorElementClass: 'invalid-feedback',
    action: 'renderInput',
    errorAction: 'renderInputError',
  },
  passwordConfirmation: {
    selector: '[name="passwordConfirmation"]',
    inputErrorClass: 'is-invalid',
    errorElementSelector: '.invalid-feedback',
    errorElementClass: 'invalid-feedback',
    action: 'renderInput',
    errorAction: 'renderInputError',
  },
  isValid: {
    selector: '[type="submit"]',
    action: 'renderSubmit',
  },
  isSubmitting: {
    selector: '[type="submit"]',
    action: 'renderSubmitLock',
  },
  isSubmitted: {
    selector: 'body',
    action: 'renderRegistrationSuccess',
  },
  isErrorOnSubmit: {
    selector: 'body',
    action: 'renderRegistrationFailure',
  },
};

export function render(elementName, value, action) {
  const config = renderConfig[elementName];
  const element = document.querySelector(config.selector);

  switch (action) {
    case 'renderInput':
      element.value = value;
      break;
    case 'renderInputError':
      const parentEl = element.closest('.form-group');
      const errorEl = parentEl?.querySelector(config.errorElementSelector);

      if (errorEl) {
        element.classList.remove(config.inputErrorClass);
        errorEl.remove();
      }

      if (value) {
        element.classList.add(config.inputErrorClass);

        const errorEl = document.createElement('div');
        errorEl.classList.add(config.errorElementClass);
        errorEl.textContent = value;
        parentEl?.append(errorEl);
      }
      break;
    case 'renderSubmit':
      element.disabled = !value;
      break;
    case 'renderSubmitLock':
      if (value) {
        element.disabled = true;
      }
      break;
    case 'renderRegistrationSuccess':
      if (value) {
        element.innerHTML = '';
        element.textContent = 'User Created';
      }
      break;
    case 'renderRegistrationFailure':
      if (value) {
        element.innerHTML = '';
        element.textContent = errorMessages.network.error;
      }
      break;
    default:
      throw new Error('Unknown action.');
  }
}