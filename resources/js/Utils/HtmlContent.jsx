import React from 'react';

const HtmlContent = ({ className, html, properties }) => {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} {...properties} />
  );
};

export default HtmlContent;