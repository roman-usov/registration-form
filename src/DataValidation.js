export default class DataValidation {
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