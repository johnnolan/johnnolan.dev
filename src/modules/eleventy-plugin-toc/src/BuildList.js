// Replace list copied from https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
const _escText = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const _buildLink = ({ id, text, children }, ul, flat, anchorClass) => {
  let nestedList = "";

  if (children.length > 0 && flat) {
    nestedList = children.map((child) => _buildLink(child, ul, flat, anchorClass));
  } else if (children.length > 0) {
    nestedList = BuildList(children, ul, flat, anchorClass);
  }

  const anchorClassAttribute = anchorClass ? ` class="${anchorClass}"` : "";

  if (id && text && flat) {
    return `<li><a href="#${_escText(id)}"${anchorClassAttribute}>${_escText(text)}</a></li>${(
      nestedList || []
    ).join("")}`;
  } else if (id && text) {
    return `<li><a href="#${_escText(id)}"${anchorClassAttribute}>${_escText(text)}</a>${nestedList}</li>`;
  } else {
    return nestedList;
  }
};

const BuildList = (listItems, ul, flat, anchorClass) => {
  const listType = ul ? "ul" : "ol";
  const list = listItems
    .map((item) => _buildLink(item, ul, flat, anchorClass))
    .filter(Boolean);

  return list.length > 0 ? `<${listType}>${list.join("")}</${listType}>` : "";
};

export default BuildList;
