// @ts-check
/* eslint-disable no-param-reassign, no-console  */


import axios from 'axios';
import { addHandlerForInputs, addHandlerForSubmit, renderConfig, render } from './view';
import Model from './Model';
// urls нельзя хардкодить: https://ru.hexlet.io/blog/posts/izbavlyaytes-ot-strok

// BEGIN (write your solution here)

const routes = {
  usersPath: () => '/users',
};

const urls = {
  usersUrl: () =>
    'https://web-js-frontend-architecture-forms-5904133.evaluator2-5.hexlet.io/',
};

const BASE_URL =
  process.env.NODE_ENV === 'test' ? 'http://localhost' : urls.usersUrl();

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
};

// ========== CONTROLLER ============
export function handleChange(path, value) {
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
  const url = new URL(routes.usersPath(), BASE_URL);

  const response = await axios.post(url.href, data);

  return response;
}

export default function app() {
  const model = new Model();

  addHandlerForInputs(model, handleInput);
  addHandlerForSubmit(model, handleSubmit);
}
// END
