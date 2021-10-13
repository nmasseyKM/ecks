import {
  ArrayGroup,
  Binary,
  BinaryOperator,
  Expression,
  Grouping,
  MethodCall,
  Primitive,
  SetGroup,
  TypedValue,
  Unary,
  UnaryOperator
} from './ast'
import XArray from './std/array'
import XSet from './std/set'

export default class Interpreter {
  #expression: Expression
  constructor (expression: Expression) {
    this.#expression = expression
  }

  eval (): TypedValue {
    return this.#evaluate(this.#expression)
  }

  #evaluate (expression: Expression): TypedValue {
    switch (expression.kind) {
      case 'primitive': return this.#primitive(expression)
      case 'grouping': return this.#grouping(expression)
      case 'unary': return this.#unary(expression)
      case 'binary': return this.#binary(expression)
      case 'array': return this.#array(expression)
      case 'set': return this.#set(expression)
      case 'method-call': return this.#methodCall(expression)
    }
  }

  #primitive (primitive: Primitive): TypedValue {
    return primitive.value
  }

  #grouping (grouping: Grouping): TypedValue {
    return this.#evaluate(grouping.expression)
  }

  #unary (unary: Unary): TypedValue {
    const operand = this.#evaluate(unary.operand)

    switch (unary.operator) {
      case UnaryOperator.Negation:
        if ('neg' in operand) return operand.neg()
        break
      case UnaryOperator.Not:
        if ('not' in operand) return operand.not()
        break
    }

    throw new TypeError()
  }

  #binary (binary: Binary): TypedValue {
    const l = this.#evaluate(binary.left)
    const r = this.#evaluate(binary.right)

    switch (binary.operator) {
      case BinaryOperator.Addition:
        if ('add' in l) return l.add(r)
        break
      case BinaryOperator.Subtraction:
        if ('sub' in l) return l.sub(r)
        break
      case BinaryOperator.Multiplication:
        if ('mult' in l) return l.mult(r)
        break
      case BinaryOperator.Division:
        if ('div' in l) return l.div(r)
        break
      case BinaryOperator.Equal:
        if ('eq' in l) return l.eq(r)
        break
      case BinaryOperator.NotEqual:
        if ('neq' in l) return l.neq(r)
        break
      case BinaryOperator.LessThan:
        if ('lt' in l) return l.lt(r)
        break
      case BinaryOperator.LessThanOrEqual:
        if ('lte' in l) return l.lte(r)
        break
      case BinaryOperator.GreaterThan:
        if ('gt' in l) return l.gt(r)
        break
      case BinaryOperator.GreaterThanOrEqual:
        if ('gte' in l) return l.gte(r)
        break
      case BinaryOperator.Or:
        if ('or' in l) return l.or(r)
        break
      case BinaryOperator.And:
        if ('and' in l) return l.and(r)
        break
    }

    throw new TypeError()
  }

  #array (array: ArrayGroup): TypedValue {
    return new XArray(array.elements.map(e => this.#evaluate(e)))
  }

  #set (set: SetGroup): TypedValue {
    return new XSet(set.elements.map(e => this.#evaluate(e)))
  }

  #methodCall (methodCall: MethodCall): TypedValue {
    const receiver = this.#evaluate(methodCall.receiver)

    if (methodCall.identifier.name in receiver.methods) {
      const method = receiver.methods[methodCall.identifier.name]
      if (methodCall.arguments.length === method.arguments.length) {
        return method.call.apply(null, methodCall.arguments.map(exp => this.#evaluate(exp)))
      }
      throw new Error('Incorrect number of arguments')
    }

    throw new Error(`No method "${methodCall.identifier.name}" for ${receiver.kind}`)
  }
}
