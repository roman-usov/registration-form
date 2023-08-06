const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
};

// BEGIN
const renderFormProcessStatus = (elements, processState) => {
  switch (processState) {
    case 'sent':
      elements.container.innerHTML = 'User Created!';
      break;

    case 'error':
      elements.submitButton.disabled = false;
      break;

    case 'sending':
      elements.submitButton.disabled = true;
      break;

    case 'filling':
      elements.submitButton.disabled = false;
      break;

    default:
      // https://ru.hexlet.io/blog/posts/sovershennyy-kod-defolty-v-svitchah
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderFormSubmissionError = (elements, state) => {
  // вывести сообщение о сетевой ошибке
  elements.container.innerHTML = state.signupProcess.processError;
};

const renderError = (fieldElement, error) => {
  // Простой способ: очищать контейнер полностью перерисовывая его
  // Более сложный способ, с оптимизацией: если элемент существует, то заменять контент
  // Если элемент не существует, то создаём новый. Всё это является частью отрисовки
  const feedbackElement = fieldElement.nextElementSibling;
  if (feedbackElement) {
    feedbackElement.textContent = error.message;
    return;
  }

  fieldElement.classList.add('is-invalid');
  const newFeedbackElement = document.createElement('div');
  newFeedbackElement.classList.add('invalid-feedback');
  newFeedbackElement.textContent = error.message;
  fieldElement.after(newFeedbackElement);
};

const renderErrors = (elements, errors, prevErrors, state) => {
  Object.entries(elements.fields).forEach(([fieldName, fieldElement]) => {
    const error = errors[fieldName];
    // правильный путь - проверять модель, а не DOM. Модель - единый источник правды.
    const fieldHadError = has(prevErrors, fieldName);
    const fieldHasError = has(errors, fieldName);
    if (!fieldHadError && !fieldHasError) {
      return;
    }

    if (fieldHadError && !fieldHasError) {
      fieldElement.classList.remove('is-invalid');
      fieldElement.nextElementSibling.remove();
      return;
    }

    if (state.form.fieldsUi.touched[fieldName] && fieldHasError) {
      renderError(fieldElement, error);
    }
  });
};
// Представление не меняет модель.
// По сути, в представлении происходит отображение модели на страницу
// Для оптимизации рендер происходит точечно в зависимости от того, какая часть модели изменилась
// Функция возвращает функцию. Подробнее: https://ru.hexlet.io/qna/javascript/questions/chto-oznachaet-funktsiya-vida-const-render-a-b
const render = (elements, initialState) => (path, value, prevValue) => {
  switch (path) {
    case 'signupProcess.processState':
      renderFormProcessStatus(elements, value);
      break;

    case 'signupProcess.processError':
      renderFormSubmissionError(elements, initialState);
      break;

    case 'form.valid':
      elements.submitButton.disabled = !value;
      break;

    case 'form.errors':
      renderErrors(elements, value, prevValue, initialState);
      break;

    default:
      break;
  }
};

export default () => {
  const elements = {
    container: document.querySelector('[data-container="sign-up"]'),
    form: document.querySelector('[data-form="sign-up"]'),
    fields: {
      name: document.getElementById('sign-up-name'),
      email: document.getElementById('sign-up-email'),
      password: document.getElementById('sign-up-password'),
      passwordConfirmation: document.getElementById(
        'sign-up-password-confirmation'
      ),
    },
    submitButton: document.querySelector('input[type="submit"]'),
  };
  // Модель ничего не знает о контроллерах и о представлении. В ней не хранятся DOM-элементы.
  const initialState = {
    signupProcess: {
      processState: 'filling',
      processError: null,
    },
    form: {
      valid: true,
      errors: {},
      fields: {
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
      },
      fieldsUi: {
        touched: {
          name: false,
          email: false,
          password: false,
          passwordConfirmation: false,
        },
      },
    },
  };
  const state = onChange(initialState, render(elements, initialState));

  // Контроллеры меняют модель, тем самым вызывая рендеринг.
  // Контроллеры не должны менять DOM напрямую, минуя представление.
  Object.entries(elements.fields).forEach(([fieldName, fieldElement]) => {
    fieldElement.addEventListener('input', e => {
      const { value } = e.target;
      state.form.fields[fieldName] = value;
      state.form.fieldsUi.touched[fieldName] = true;
      const errors = validate(state.form.fields);
      state.form.errors = errors;
      state.form.valid = isEmpty(errors);
    });
  });

  elements.form.addEventListener('submit', async e => {
    e.preventDefault();

    state.signupProcess.processState = 'sending';
    state.signupProcess.processError = null;

    try {
      const data = {
        name: state.form.fields.name,
        email: state.form.fields.email,
        password: state.form.fields.password,
      };
      await axios.post(routes.usersPath(), data);
      state.signupProcess.processState = 'sent';
    } catch (err) {
      // в реальных приложениях необходимо помнить об обработке ошибок сети
      state.signupProcess.processState = 'error';
      state.signupProcess.processError = errorMessages.network.error;
      throw err;
    }
  });
};
// END
