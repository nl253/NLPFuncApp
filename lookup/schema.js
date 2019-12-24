module.exports = {
  "$id": "lookup",
  "type": "object",
  "required": ["word"],
  "properties": {
    "word": {
      "type": "string",
      "minLength": 1,
      "pattern": "[a-zA-Z ]+"
    }
  }
};