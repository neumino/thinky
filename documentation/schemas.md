---
layout: documentation
permalink: schemas/
---

## Schemas

### Introduction

The schema is represented with an object where each field maps to a type.  
The valid types are:

- `String`
- `Boolean`
- `Number`
- `Date`
- An object with the fields:
    - `_type` (mandatory): Can be `String`/`Boolean`/`Number`/`Date`/`Object`/`Array`
    - `schema` (optional): The schema if the field `_type` is `Object` or `Array`
    - `options` (optional):
        - `enforce_missing`: `Boolean`, `true` to forbid missing fields.
        - `enforce_extra`: `Boolean`, `true` to forbid fields not defined in the schema.
        - `enforce_type`: can be `"strict"`, `"loose"`, `"none"`
    - `default` (optional): can be constant value or a function that will be called with
    the document as context.
- An object that is a valid schema
- An array with one of the previous type

