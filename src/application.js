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
    this.watchedInputState = onChange(
      this.state.formData,
      handleInputStateChange
    );
    this.watchedFormState = onChange(this.state.form, handleFormStateChange);
    this.watchedErrorState = onChange(
      this.state.errors,
      handleErrorStateChange
    );
    this.validation = new DataValidation(schema);
  }

  setIsValid() {
    const hasFullData = Object.values(this.watchedInputState).every(
      value => !isEmpty(value)
    );

    const dataIsValid = Object.values(this.watchedErrorState).every(value =>
      isEmpty(value)
    );

    this.watchedFormState.isValid = hasFullData && dataIsValid;
  }

  addError(fieldName, errorMessage) {
    this.watchedErrorState[fieldName] = errorMessage;
  }

  clearError(fieldName) {
    this.watchedErrorState[fieldName] = null;
  }

  async revalidatePassword(fieldName) {
    if (fieldName !== 'password') return;

    if (
      !this.state.isTouched.passwordConfirmation &&
      !this.watchedInputState.passwordConfirmation
    )
      return;

    const passwordRevalidation = await this.validation.validateField(
      'passwordConfirmation',
      this.watchedInputState
    );

    if (isEmpty(passwordRevalidation)) {
      this.clearError('passwordConfirmation');
    } else {
      const [error] = passwordRevalidation;
      this.addError('passwordConfirmation', error);
    }
  }

  updateFormState(fieldName, fieldValue) {
    this.watchedFormState[fieldName] = fieldValue;
  }

  async updateInputState(fieldName, fieldValue) {
    this.watchedInputState[fieldName] = fieldValue;

    this.state.isTouched[fieldName] = true;

    this.clearError(fieldName);

    const validationResults = await this.validation.validateField(
      fieldName,
      this.watchedInputState
    );

    if (!isEmpty(validationResults)) {
      const [error] = validationResults;
      this.watchedErrorState[fieldName] = error;

      this.addError(fieldName, error);
    }

    await this.revalidatePassword(fieldName);

    this.setIsValid();
  }

  getFormData() {
    return this.watchedInputState;
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

function renderInput(fieldValue, fieldName) {
  const inputEl = document.querySelector(`[name="${fieldName}"]`);

  if (inputEl) {
    inputEl.value = fieldValue;
  }
}

function renderInputError(errorMessage, fieldName) {
  const inputEl = document.querySelector(`[name="${fieldName}"]`);
  const parentEl = inputEl?.closest('.form-group');
  const errorEl = parentEl?.querySelector('.invalid-feedback');

  if (errorEl) {
    inputEl?.classList.remove('is-invalid');
    errorEl?.remove();
  }

  if (errorMessage) {
    inputEl?.classList.add('is-invalid');
    const errorEl = document.createElement('div');
    errorEl.classList.add('invalid-feedback');
    errorEl.textContent = errorMessage;
    parentEl?.append(errorEl);
  }
}

function renderSubmitBtn(isValid) {
  const submitBtnEl = document.querySelector('[type="submit"]');

  if (submitBtnEl) {
    submitBtnEl.disabled = !isValid;
  }
}

function lockSubmitBtnOnSubmit(isSubmitting) {
  if (isSubmitting) {
    const submitBtnEl = document.querySelector('[type="submit"]');

    if (submitBtnEl) {
      submitBtnEl.disabled = true;
    }
  }
}

function renderRegisterUserError(isErrorOnSubmit) {
  if (isErrorOnSubmit) {
    const containerEl = document.querySelector('[data-form="sign-up"]');

    if (containerEl) {
      containerEl.innerHTML = '';
      containerEl.textContent = errorMessages.network.error;
    }
  }
}

function renderRegisteredUser(isSubmitted) {
  if (isSubmitted) {
    const containerEl = document.querySelector('[data-form="sign-up"]');

    if (containerEl) {
      containerEl.innerHTML = '';
      containerEl.textContent = 'User created!';
    }
  }
}

// ========== CONTROLLER ============
function handleInputStateChange(path, value) {
  renderInput(value, path);
}

const formRenderOptions = {
  isValid: renderSubmitBtn,
  isSubmitted: renderRegisteredUser,
  isErrorOnSubmit: renderRegisterUserError,
  isSubmitting: lockSubmitBtnOnSubmit,
};

function handleFormStateChange(path, value) {
  formRenderOptions[path](value, path);
}

function handleErrorStateChange(path, value) {
  renderInputError(value, path);
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
