import { Variable } from "../analysers/models/variable";

export class VariableFactory {
  create(name: string, value: string): Variable {
    if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
      // Replace first and last ' by " for JSON parsing
      value = '"\\"' + value.substring(1);
      value = value.substring(0, value.length - 1) + '\\""';

      // Replace \' by '
      value = value.replace(/\\'/, "'");
    }

    if (value.indexOf("\\'") !== -1) {
      // Replace \' by '
      value = value.replace(/\\'/, "'");
    }


    let type = 'any';
    try {
      value = JSON.parse(value);
      type = typeof value;
    } catch (e) { }

    if (type === 'object') {
      type = '{ [key: string]: any }';
    }

    const property: Variable = {
      name: name,
      type: type,
      value: value
    }
    return property;
  }
}
