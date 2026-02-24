const html2string = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return (doc.body.textContent || '').trim();
}

export default html2string