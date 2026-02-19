/**
 * Formata uma string XML minificada para uma estrutura indentada e legível.
 * Resolve o problema de indentação em "escada" comum em Regex simples.
 */
export const formatXML = (xml: string): string => {
  const PADDING = '  '; 
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  
  // Caso o XML seja inválido, retorna a string original
  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    return xml;
  }

  let result = '';
  let indent = '';

  const traverse = (node: Node) => {
    // Nó de Elemento (Tags)
    if (node.nodeType === 1) {
      result += indent + '<' + node.nodeName;
      
      // Preserva atributos (importante para o xs:schema do Delphi)
      const element = node as Element;
      if (element.attributes.length > 0) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          result += ` ${attr.nodeName}="${attr.nodeValue}"`;
        }
      }

      if (node.childNodes.length > 0) {
        // Se o único filho for um nó de texto, mantém na mesma linha
        if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
          result += '>' + node.childNodes[0].nodeValue?.trim() + '</' + node.nodeName + '>\n';
        } else {
          result += '>\n';
          indent += PADDING;
          for (let i = 0; i < node.childNodes.length; i++) {
            traverse(node.childNodes[i]);
          }
          indent = indent.substring(0, indent.length - PADDING.length);
          result += indent + '</' + node.nodeName + '>\n';
        }
      } else {
        result += '/>\n';
      }
    } 
    // Nó de Texto solto (ignora espaços vazios entre tags)
    else if (node.nodeType === 3) {
      const text = node.nodeValue?.trim();
      if (text && node.parentNode?.childNodes.length !== 1) {
        result += indent + text + '\n';
      }
    }
  };

  traverse(xmlDoc.documentElement);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + result;
};