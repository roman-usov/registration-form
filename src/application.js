// @ts-check
/* eslint-disable no-param-reassign, no-console  */

import isEmpty from 'lodash/isEmpty.js';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

// urls нельзя хардкодить: https://ru.hexlet.io/blog/posts/izbavlyaytes-ot-strok

// BEGIN (write your solution here)

const routes = {
  usersPath: () => '/users',
};

const urls = {
  usersUrl: () =>
    'https://web-js-frontend-architecture-forms-5904133.evaluator2-5.hexlet.io/',
};

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
};

// ========== MODEL =================
const schema = yup.object().shape({
  name: yup.string().trim().defined().required(),
  email: yup.string().required('email must be a valid email').email(),
  password: yup.string().defined().required().min(6),
  passwordConfirmation: yup
    .string()
    // .notOneOf([null], 'password confirmation is a required field')
    .required('password confirmation is a required field')
    .oneOf(
      [yup.ref('password'), null],
      'password confirmation does not match to password'
    ),
});

class DataValidation {
  constructor(schema) {
    this.schema = schema;
  }

  async validateField(fieldName, formData) {
    try {
      await this.schema.validateAt(fieldName, formData);
      return {};
    } catch (e) {
      return e.errors;
    }
  }
}

class Model {
  constructor() {
    this.state = {
      form: {
        isValid: false,
        isSubmitted: false,
        isErrorOnSubmit: false,
        isSubmitting: false,
      },
      formData: {
        name: null,
        email: null,
        password: '',
        passwordConfirmation: null,
      },
      isTouched: {
        name: false,
        email: false,
        password: false,
        passwordConfirmation: false,
      },
      errors: {
        name: null,
        email: null,
        password: null,
        passwordConfirmation: null,
      },
    };
    this.watchedState = onChange(this.state, handleChange);
    this.validation = new DataValidation(schema);
  }

  setIsValid() {
    const hasFullData = Object.values(this.watchedState.formData).every(
      value => !isEmpty(value)
    );

    const dataIsValid = Object.values(this.watchedState.errors).every(value =>
      isEmpty(value)
    );

    this.watchedState.form.isValid = hasFullData && dataIsValid;
  }

  addError(fieldName, errorMessage) {
    this.watchedState.errors[fieldName] = errorMessage;
  }

  clearError(fieldName) {
    this.watchedState.errors[fieldName] = null;
  }

  async revalidatePassword(fieldName) {
    if (fieldName !== 'password') return;

    if (
      !this.state.isTouched.passwordConfirmation &&
      !this.watchedState.formData.passwordConfirmation
    )
      return;

    const passwordRevalidation = await this.validation.validateField(
      'passwordConfirmation',
      this.watchedState.formData
    );

    if (isEmpty(passwordRevalidation)) {
      this.clearError('passwordConfirmation');
    } else {
      const [error] = passwordRevalidation;
      this.addError('passwordConfirmation', error);
    }
  }

  updateFormState(fieldName, fieldValue) {
    this.watchedState.form[fieldName] = fieldValue;
  }

  async updateInputState(fieldName, fieldValue) {
    this.watchedState.formData[fieldName] = fieldValue;

    this.state.isTouched[fieldName] = true;

    this.clearError(fieldName);

    const validationResults = await this.validation.validateField(
      fieldName,
      this.watchedState.formData
    );

    if (!isEmpty(validationResults)) {
      const [error] = validationResults;
      this.watchedState[fieldName] = error;

      this.addError(fieldName, error);
    }

    await this.revalidatePassword(fieldName);

    this.setIsValid();
  }

  printState() {
    console.log(JSON.stringify(this.state));
  }

  getFormData() {
    return this.watchedState.formData;
  }
}

// ========== VIEW ==================
function addHandlerForInputs(model, handler) {
  const formContainerEl = document.querySelector('[data-container="sign-up"]');
  formContainerEl?.addEventListener('blur', handler.bind(null, model), true);
  formContainerEl?.addEventListener('input', handler.bind(null, model));
}

function addHandlerForSubmit(model, handler) {
  const formEl = document.querySelector('[data-form="sign-up"]');
  formEl?.addEventListener('submit', handler.bind(null, model));
}

const renderConfig = {
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
    selector: '[data-form="sign-up"]',
    action: 'renderRegistrationSuccess',
  },
  isErrorOnSubmit: {
    selector: '[data-form="sign-up"]',
    action: 'renderRegistrationFailure',
  },
};

function render(elementName, value, action) {
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
        element.textContent = 'User created!';
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

// ========== CONTROLLER ============
function handleChange(path, value) {
  const [formSection, property] = path.split('.');
  const config = renderConfig[property];

  if (formSection === 'isTouched') return;

  switch (formSection) {
    case 'formData':
      render(property, value, config.action);
      break;
    case 'errors':
      render(property, value, config.errorAction);
      break;
    case 'form':
      render(property, value, config.action);
      break;
    default:
      return;
  }
}

async function handleInput(model, e) {
  const targetElement = e.target;

  if (
    !targetElement.matches('input') ||
    targetElement.matches('[type="submit"]')
  )
    return;

  const inputName = targetElement.getAttribute('name');
  const inputValue = targetElement.value.trim();

  await model.updateInputState(inputName, inputValue);
}

async function handleSubmit(model, e) {
  e.preventDefault();
  model.updateFormState('isSubmitting', true);

  try {
    await createUser(model.formData);
    model.updateFormState('isSubmitted', true);
    model.updateFormState('isSubmitting', false);
  } catch (e) {
    console.log(e.message);
    model.updateFormState('isErrorOnSubmit', true);
    model.updateFormState('isSubmitted', false);
    model.updateFormState('isSubmitting', false);
  }
}

async function createUser(data) {
  const url = new URL(routes.usersPath(), urls.usersUrl());

  const response = await axios.post(url.href, data);

  return response;
}

export default function app() {
  const model = new Model();

  addHandlerForInputs(model, handleInput);
  addHandlerForSubmit(model, handleSubmit);
}
// END
