import isEmpty from 'lodash/isEmpty.js';
import * as yup from 'yup';
import onChange from 'on-change';
import { handleChange } from './application';
import DataValidation from './DataValidation';

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

export default class Model {
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

  getFormData() {
    return this.watchedState.formData;
  }
}