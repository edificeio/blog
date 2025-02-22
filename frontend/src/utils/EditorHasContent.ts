export const isEmptyEditorContent = (json: any) => {
  if (
    Array.isArray(json?.content) &&
    json.content.length === 1 &&
    'paragraph' === json.content[0].type &&
    !Object.prototype.hasOwnProperty.call(json.content[0], 'content')
  ) {
    return true;
  }
  return false;
};
